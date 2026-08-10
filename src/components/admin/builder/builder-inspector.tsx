import * as React from "react";
import { X, Settings2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MediaUploader } from "@/components/admin/builder/MediaUploader";
import { ColorPicker } from "@/components/admin/builder/ColorPicker";
import { ArrayBuilder } from "@/components/admin/builder/ArrayBuilder";
import type { ExperienceNode } from "@/lib/builder-types";
import { builderRegistry } from "@/lib/builder-registry";

export type InspectorTab = "content" | "connection" | "layout" | "design";
export type InspectorMode = "quick" | "studio";

export interface BuilderInspectorProps {
  selectedNodeId: string | null;
  selectedNode?: ExperienceNode | any;
  blockManifest?: any;
  inspectorTab: InspectorTab;
  setInspectorTab: (tab: InspectorTab) => void;
  setSelectedNodeId: (id: string | null) => void;
  updateNode: (nodeId: string, section: any, field: string, value: any) => void;
  setNodes: React.Dispatch<React.SetStateAction<any[]>>;
  collections?: any[];
  categories?: any[];
  treeNodes?: any[];
}

export function BuilderInspector({
  selectedNodeId,
  selectedNode,
  blockManifest,
  inspectorTab,
  setInspectorTab,
  setSelectedNodeId,
  updateNode,
  setNodes,
  collections = [],
  categories = [],
  treeNodes = [],
}: BuilderInspectorProps) {
  const [inspectorMode, setInspectorMode] = React.useState<InspectorMode>("quick");

  // Helper to find the main content block inside a section
  const findPrimaryContentNode = (nodeId: string, tree: any[]): any | null => {
    for (const n of tree) {
      if (n.id === nodeId) {
        const searchDescendants = (node: any): any | null => {
          if (node.node_type === "composition" || node.node_type === "element") return node;
          if (node.children) {
            for (const child of node.children) {
              const found = searchDescendants(child);
              if (found) return found;
            }
          }
          return null;
        };
        // We start searching from the children of the section to not return the section itself if it were an element
        if (n.children) {
          for (const child of n.children) {
            const found = searchDescendants(child);
            if (found) return found;
          }
        }
        return null;
      }
      if (n.children) {
        const found = findPrimaryContentNode(nodeId, n.children);
        if (found) return found;
      }
    }
    return null;
  };

  const primaryChild =
    selectedNode?.block_type === "section"
      ? findPrimaryContentNode(selectedNode.id, treeNodes)
      : null;
  const primaryManifest = primaryChild ? (builderRegistry as any)[primaryChild.block_type] : null;

  const renderCollectionSelect = (nodeToUpdate: any, fieldName: string) => {
    return (
      <select
        className="w-full text-sm p-2 bg-white/5 border border-white/10 text-white"
        value={(nodeToUpdate.content as any)?.[fieldName] ?? ""}
        onChange={(e) => {
          const slug = e.target.value;
          setNodes((prev: any[]) =>
            prev.map((n) => {
              if (n.id === nodeToUpdate.id) {
                return {
                  ...n,
                  content: { ...(n.content || {}), [fieldName]: slug },
                  data_bindings: slug
                    ? { source: "product_collection", collection_slug: slug }
                    : {},
                };
              }
              return n;
            }),
          );
        }}
      >
        <option value="">Selecione para vincular...</option>
        {collections?.map((col: any) => (
          <option key={col.id} value={col.slug}>
            [Coleção] {col.title}
          </option>
        ))}
        {categories?.map((cat: any) => (
          <option key={cat.id} value={cat.slug}>
            [Categoria] {cat.name}
          </option>
        ))}
      </select>
    );
  };

  return (
    <aside className="w-72 bg-[#1a1a1a] border-l border-white/10 flex flex-col flex-none overflow-hidden">
      {selectedNode && blockManifest ? (
        <>
          {/* Inspector Header */}
          <div className="flex-none border-b border-white/10 p-3">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-white text-sm font-semibold">{blockManifest.name}</p>
                <p className="text-white/40 text-[10px] font-mono">{selectedNode.block_type}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedNodeId(null)}
                className="text-white/30 hover:text-white/70 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Mode Toggle */}
            <div className="flex bg-[#2a2a2a] p-1 mb-3">
              <button
                type="button"
                onClick={() => setInspectorMode("quick")}
                className={cn(
                  "flex-1 text-[11px] font-medium py-1 rounded-md transition-colors",
                  inspectorMode === "quick"
                    ? "bg-white/10 text-white"
                    : "text-white/40 hover:text-white/70",
                )}
              >
                Modo Guiado
              </button>
              <button
                type="button"
                onClick={() => setInspectorMode("studio")}
                className={cn(
                  "flex-1 text-[11px] font-medium py-1 rounded-md transition-colors",
                  inspectorMode === "studio"
                    ? "bg-white/10 text-white"
                    : "text-white/40 hover:text-white/70",
                )}
              >
                Modo Studio
              </button>
            </div>

            {/* Inspector Tabs (Studio Mode Only) */}
            {inspectorMode === "studio" && (
              <div className="flex gap-1">
                {(
                  [
                    "content",
                    "connection",
                    ...(blockManifest.inspector?.layout ? ["layout"] : []),
                    ...(blockManifest.inspector?.design ? ["design"] : []),
                  ] as const
                ).map((tab) => (
                  <button
                    type="button"
                    key={tab}
                    onClick={() => setInspectorTab(tab as InspectorTab)}
                    className={cn(
                      "px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors capitalize",
                      inspectorTab === tab
                        ? "bg-white/15 text-white"
                        : "text-white/40 hover:text-white/70",
                    )}
                  >
                    {tab === "content"
                      ? "Conteúdo"
                      : tab === "connection"
                        ? "Dados"
                        : tab === "layout"
                          ? "Layout"
                          : "Design"}
                  </button>
                ))}
              </div>
            )}
          </div>

          <ScrollArea className="flex-1">
            {inspectorMode === "quick" ? (
              <div className="p-4 space-y-6">
                {selectedNode.block_type === "section" ? (
                  <div className="space-y-4">
                    <div>
                      <p className="text-white/80 text-sm font-medium mb-1">Aparência da Seção</p>
                      <p className="text-white/40 text-xs mb-3">
                        Escolha um tema visual para aplicar a esta seção.
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { id: "default", label: "Padrão", bg: "bg-[#18181b]" },
                          { id: "zine", label: "Zine", bg: "bg-[#f5f5f5] border-2 border-black" },
                          {
                            id: "ticket",
                            label: "Ticket",
                            bg: "bg-white border-2 border-dashed border-gray-300",
                          },
                          { id: "polaroid", label: "Polaróide", bg: "bg-[#fffff8] shadow-sm pb-4" },
                        ].map((theme) => (
                          <button
                            key={theme.id}
                            type="button"
                            onClick={() =>
                              updateNode(
                                selectedNode.id,
                                "design_tokens",
                                "surfaceVariant",
                                theme.id,
                              )
                            }
                            className={cn(
                              "flex flex-col items-center gap-2 p-3 rounded-xl border transition-all text-center",
                              (selectedNode.design_tokens as any)?.surfaceVariant === theme.id ||
                                (!(selectedNode.design_tokens as any)?.surfaceVariant &&
                                  theme.id === "default")
                                ? "border-primary bg-primary/10"
                                : "border-white/10 bg-white/5 hover:border-white/30",
                            )}
                          >
                            <div className={cn("w-full aspect-video rounded-md", theme.bg)} />
                            <span className="text-white/70 text-xs font-medium">{theme.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <p className="text-white/80 text-sm font-medium">Espaçamento Interno</p>
                      <select
                        className="w-full text-sm p-2 bg-white/5 border border-white/10 text-white"
                        value={(selectedNode.design_tokens as any)?.surfacePadding ?? "none"}
                        onChange={(e) =>
                          updateNode(
                            selectedNode.id,
                            "design_tokens",
                            "surfacePadding",
                            e.target.value,
                          )
                        }
                      >
                        <option value="none">Sem Espaçamento</option>
                        <option value="sm">Apertado (Pequeno)</option>
                        <option value="md">Padrão (Médio)</option>
                        <option value="lg">Espaçoso (Grande)</option>
                      </select>
                    </div>

                    {/* Smart Inspector: Elevate Content Controls for primary child */}
                    {primaryChild && primaryManifest && primaryManifest.inspector?.content && (
                      <div className="space-y-4 pt-4 border-t border-white/10">
                        <p className="text-white/80 text-sm font-medium mb-1">Conteúdo da Seção</p>
                        <p className="text-white/40 text-xs mb-3">
                          Editando: {primaryManifest.name}
                        </p>
                        {primaryManifest.inspector.content.map((field: any) => (
                          <div key={field.name} className="space-y-1.5">
                            <label className="text-white/60 text-[11px] font-medium uppercase tracking-wide">
                              {field.label}
                            </label>
                            {field.type === "textarea" ? (
                              <Textarea
                                className="text-sm bg-white/5 border-white/10 text-white placeholder:text-white/30 resize-none"
                                rows={3}
                                value={(primaryChild.content as any)?.[field.name] ?? ""}
                                onChange={(e) =>
                                  updateNode(primaryChild.id, "content", field.name, e.target.value)
                                }
                              />
                            ) : field.type === "json" || field.type === "array" ? (
                              <ArrayBuilder
                                label={field.label}
                                value={
                                  Array.isArray((primaryChild.content as any)?.[field.name])
                                    ? (primaryChild.content as any)[field.name]
                                    : []
                                }
                                onChange={(val) =>
                                  updateNode(primaryChild.id, "content", field.name, val)
                                }
                                arrayFields={field.arrayFields ?? []}
                              />
                            ) : field.type === "image" ? (
                              <MediaUploader
                                value={(primaryChild.content as any)?.[field.name] ?? ""}
                                onChange={(val) =>
                                  updateNode(primaryChild.id, "content", field.name, val)
                                }
                              />
                            ) : field.type === "collection_select" ? (
                              renderCollectionSelect(primaryChild, field.name)
                            ) : (
                              <Input
                                className="h-8 text-sm bg-white/5 border-white/10 text-white placeholder:text-white/30"
                                value={(primaryChild.content as any)?.[field.name] ?? ""}
                                onChange={(e) =>
                                  updateNode(primaryChild.id, "content", field.name, e.target.value)
                                }
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-white/60 text-xs">
                      Para editar estilos visuais, selecione a Seção raiz deste bloco.
                    </p>
                    {/* Render content fields in quick mode */}
                    <div className="space-y-4 pt-4 border-t border-white/10">
                      <p className="text-white/80 text-sm font-medium mb-1">Conteúdo</p>
                      {blockManifest.inspector?.content?.map((field: any) => (
                        <div key={field.name} className="space-y-1.5">
                          <label className="text-white/60 text-[11px] font-medium uppercase tracking-wide">
                            {field.label}
                          </label>
                          {field.type === "textarea" ? (
                            <Textarea
                              className="text-sm bg-white/5 border-white/10 text-white placeholder:text-white/30 resize-none"
                              rows={3}
                              value={(selectedNode.content as any)?.[field.name] ?? ""}
                              onChange={(e) =>
                                updateNode(selectedNode.id, "content", field.name, e.target.value)
                              }
                            />
                          ) : field.type === "image" ? (
                            <MediaUploader
                              value={(selectedNode.content as any)?.[field.name] ?? ""}
                              onChange={(val) =>
                                updateNode(selectedNode.id, "content", field.name, val)
                              }
                            />
                          ) : field.type === "collection_select" ? (
                            renderCollectionSelect(selectedNode, field.name)
                          ) : (
                            <Input
                              className="h-8 text-sm bg-white/5 border-white/10 text-white placeholder:text-white/30"
                              value={(selectedNode.content as any)?.[field.name] ?? ""}
                              onChange={(e) =>
                                updateNode(selectedNode.id, "content", field.name, e.target.value)
                              }
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Studio Mode Tabs Content */
              <div className="p-4 space-y-4">
                {/* Content Tab */}
                {inspectorTab === "content" && (
                  <div className="space-y-4">
                    {blockManifest.inspector?.content?.map((field: any) => (
                      <div key={field.name} className="space-y-1.5">
                        <label className="text-white/60 text-[11px] font-medium uppercase tracking-wide">
                          {field.label}
                        </label>
                        {field.type === "textarea" ? (
                          <Textarea
                            className="text-sm bg-white/5 border-white/10 text-white placeholder:text-white/30 resize-none"
                            rows={3}
                            value={(selectedNode.content as any)?.[field.name] ?? ""}
                            onChange={(e) =>
                              updateNode(selectedNode.id, "content", field.name, e.target.value)
                            }
                          />
                        ) : field.type === "json" || field.type === "array" ? (
                          <ArrayBuilder
                            label={field.label}
                            value={
                              Array.isArray((selectedNode.content as any)?.[field.name])
                                ? (selectedNode.content as any)[field.name]
                                : []
                            }
                            onChange={(val) =>
                              updateNode(selectedNode.id, "content", field.name, val)
                            }
                            arrayFields={field.arrayFields ?? []}
                          />
                        ) : field.type === "image" ? (
                          <MediaUploader
                            value={(selectedNode.content as any)?.[field.name] ?? ""}
                            onChange={(val) =>
                              updateNode(selectedNode.id, "content", field.name, val)
                            }
                          />
                        ) : field.type === "color" ? (
                          <ColorPicker
                            value={(selectedNode.content as any)?.[field.name] ?? ""}
                            onChange={(val) =>
                              updateNode(selectedNode.id, "content", field.name, val)
                            }
                          />
                        ) : field.type === "boolean" ? (
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={(selectedNode.content as any)?.[field.name] ?? false}
                              onChange={(e) =>
                                updateNode(selectedNode.id, "content", field.name, e.target.checked)
                              }
                              className="w-4 h-4 accent-primary"
                            />
                            <span className="text-white/60 text-xs">{field.label}</span>
                          </label>
                        ) : field.type === "number" ? (
                          <Input
                            type="number"
                            className="h-8 text-sm bg-white/5 border-white/10 text-white"
                            value={(selectedNode.content as any)?.[field.name] ?? ""}
                            onChange={(e) =>
                              updateNode(
                                selectedNode.id,
                                "content",
                                field.name,
                                Number(e.target.value),
                              )
                            }
                          />
                        ) : field.type === "collection_select" ? (
                          renderCollectionSelect(selectedNode, field.name)
                        ) : (
                          <Input
                            className="h-8 text-sm bg-white/5 border-white/10 text-white placeholder:text-white/30"
                            value={(selectedNode.content as any)?.[field.name] ?? ""}
                            onChange={(e) =>
                              updateNode(selectedNode.id, "content", field.name, e.target.value)
                            }
                          />
                        )}
                      </div>
                    ))}
                    {(!blockManifest.inspector?.content ||
                      blockManifest.inspector.content.length === 0) && (
                      <p className="text-white/30 text-xs">
                        Este bloco não tem campos de conteúdo editáveis.
                      </p>
                    )}
                  </div>
                )}

                {/* Connection / Data Binding Tab */}
                {inspectorTab === "connection" && (
                  <div className="space-y-4">
                    <div className="p-3 bg-white/5 border border-white/10">
                      <p className="text-white/60 text-[11px] mb-1 font-medium">Fonte de Dados</p>
                      <p className="text-white/30 text-[10px]">
                        Quando configurado, os dados são resolvidos no servidor antes de chegar ao
                        canvas.
                      </p>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-white/60 text-[11px] font-medium uppercase tracking-wide">
                        Resolver
                      </label>
                      <select
                        className="w-full text-sm p-2 bg-white/5 border border-white/10 text-white"
                        value={(selectedNode.data_bindings as any)?.source ?? ""}
                        onChange={(e) => {
                          const source = e.target.value;
                          setNodes((prev: any[]) =>
                            prev.map((n) =>
                              n.id === selectedNodeId
                                ? { ...n, data_bindings: source ? { source } : {} }
                                : n,
                            ),
                          );
                        }}
                      >
                        <option value="">Nenhum (conteúdo estático)</option>
                        <option value="dynamic_products">Últimos Produtos Ativos</option>
                        <option value="product_collection">Produtos por Coleção</option>
                        <option value="dynamic_reviews">Avaliações Aprovadas</option>
                        <option value="upcoming_events">Próximos Eventos</option>
                        <option value="latest_classifieds">Classificados da Comunidade</option>
                      </select>
                    </div>
                    {(selectedNode.data_bindings as any)?.source === "product_collection" && (
                      <div className="space-y-1.5">
                        <label className="text-white/60 text-[11px] font-medium uppercase tracking-wide">
                          Coleção ou Categoria
                        </label>
                        <select
                          className="w-full text-sm p-2 bg-white/5 border border-white/10 text-white"
                          value={(selectedNode.data_bindings as any)?.collection_slug ?? ""}
                          onChange={(e) =>
                            updateNode(
                              selectedNode.id,
                              "data_bindings",
                              "collection_slug",
                              e.target.value,
                            )
                          }
                        >
                          <option value="">Selecione para vincular...</option>
                          {collections?.map((col: any) => (
                            <option key={col.id} value={col.slug}>
                              [Coleção] {col.title}
                            </option>
                          ))}
                          {categories?.map((cat: any) => (
                            <option key={cat.id} value={cat.slug}>
                              [Categoria] {cat.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    {["dynamic_products", "upcoming_events", "latest_classifieds"].includes(
                      (selectedNode.data_bindings as any)?.source,
                    ) && (
                      <div className="space-y-1.5">
                        <label className="text-white/60 text-[11px] font-medium uppercase tracking-wide">
                          Quantidade
                        </label>
                        <Input
                          type="number"
                          min={1}
                          max={24}
                          className="h-8 text-sm bg-white/5 border-white/10 text-white"
                          value={(selectedNode.data_bindings as any)?.limit ?? 12}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10);
                            updateNode(
                              selectedNode.id,
                              "data_bindings",
                              "limit",
                              isNaN(val) ? 0 : val,
                            );
                          }}
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Layout Tab */}
                {inspectorTab === "layout" && blockManifest.inspector?.layout && (
                  <div className="space-y-4">
                    {blockManifest.inspector.layout.map((field: any) => (
                      <div key={field.name} className="space-y-1.5">
                        <label className="text-white/60 text-[11px] font-medium uppercase tracking-wide">
                          {field.label}
                        </label>
                        {field.type === "select" && field.options ? (
                          <select
                            className="w-full text-sm p-2 bg-white/5 border border-white/10 text-white"
                            value={(selectedNode.layout_rules as any)?.[field.name] ?? ""}
                            onChange={(e) =>
                              updateNode(
                                selectedNode.id,
                                "layout_rules",
                                field.name,
                                e.target.value,
                              )
                            }
                          >
                            {field.options.map((opt: any) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <Input
                            className="h-8 text-sm bg-white/5 border-white/10 text-white"
                            value={(selectedNode.layout_rules as any)?.[field.name] ?? ""}
                            onChange={(e) =>
                              updateNode(
                                selectedNode.id,
                                "layout_rules",
                                field.name,
                                e.target.value,
                              )
                            }
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Design Tab */}
                {inspectorTab === "design" && blockManifest.inspector?.design && (
                  <div className="space-y-4">
                    {blockManifest.inspector.design.map((field: any) => (
                      <div key={field.name} className="space-y-1.5">
                        <label className="text-white/60 text-[11px] font-medium uppercase tracking-wide">
                          {field.label}
                        </label>
                        {field.type === "color" ? (
                          <ColorPicker
                            value={(selectedNode.design_tokens as any)?.[field.name] ?? ""}
                            onChange={(val) =>
                              updateNode(selectedNode.id, "design_tokens", field.name, val)
                            }
                          />
                        ) : field.type === "image" ? (
                          <MediaUploader
                            value={(selectedNode.design_tokens as any)?.[field.name] ?? ""}
                            onChange={(val) =>
                              updateNode(selectedNode.id, "design_tokens", field.name, val)
                            }
                          />
                        ) : (
                          <Input
                            className="h-8 text-sm bg-white/5 border-white/10 text-white"
                            value={(selectedNode.design_tokens as any)?.[field.name] ?? ""}
                            onChange={(e) =>
                              updateNode(
                                selectedNode.id,
                                "design_tokens",
                                field.name,
                                e.target.value,
                              )
                            }
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </ScrollArea>
        </>
      ) : (
        /* No selection state */
        <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-3">
          <Settings2 className="h-8 w-8 text-white/20" />
          <p className="text-white/30 text-sm">
            Selecione um bloco no canvas para editar suas propriedades.
          </p>
        </div>
      )}
    </aside>
  );
}
