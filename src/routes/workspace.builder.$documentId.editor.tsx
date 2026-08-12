import * as React from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useCallback, useRef } from "react";
import { toast } from "sonner";
import {
  getExperienceDocument,
  saveBuilderNodes,
  publishBuilderVersion,
} from "@/services/builder.functions";
import { listCategories, listCollections } from "@/services/admin-catalog.functions";
import { BuilderTopBar } from "@/components/admin/builder/builder-top-bar";
import { BuilderLeftPanel, LeftPanelTab } from "@/components/admin/builder/builder-left-panel";
import { BuilderCanvas, ViewportMode } from "@/components/admin/builder/builder-canvas";
import { BuilderInspector, InspectorTab } from "@/components/admin/builder/builder-inspector";
import { GuidedSectionPicker } from "@/components/admin/builder/guided-section-picker";
import type { SectionTemplate } from "@/lib/builder-types";

import { builderRegistry } from "@/lib/builder-registry";

export const Route = createFileRoute("/workspace/builder/$documentId/editor")({
  head: () => ({ meta: [{ title: "Editor Visual" }] }),
  loader: async ({ params }) => {
    const [docData, categories, collections] = await Promise.all([
      getExperienceDocument({ data: { id: params.documentId } }),
      listCategories(),
      listCollections(),
    ]);

    return {
      ...docData.data,
      categories: categories || [],
      collections: collections || [],
    };
  },
  component: BuilderEditorPage,
});

function BuilderEditorPage() {
  const initialData = Route.useLoaderData();
  const navigate = useNavigate();

  const [document] = useState(initialData.document);
  const [version, setVersion] = useState(initialData.version);
  const [nodes, setNodes] = useState<any[]>(initialData.nodes || []);

  // History State
  const [history, setHistory] = useState<any[][]>([initialData.nodes || []]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // UI State
  const [viewport, setViewport] = useState<ViewportMode>("desktop");
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [inspectorTab, setInspectorTab] = useState<InspectorTab>("content");
  const [activeLeftPanel, setActiveLeftPanel] = useState<LeftPanelTab>("layers");
  const [blockCategory, setBlockCategory] = useState("hero");

  // Modals
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isSectionPickerOpen, setIsSectionPickerOpen] = useState(false);

  // Saving state
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  // History Actions
  const pushHistory = useCallback(
    (newNodes: any[]) => {
      setHistory((prev) => {
        const newHistory = prev.slice(0, historyIndex + 1);
        newHistory.push(newNodes);
        return newHistory.slice(-20); // Keep last 20 states
      });
      setHistoryIndex((prev) => Math.min(prev + 1, 19));
      setNodes(newNodes);
    },
    [historyIndex],
  );

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setNodes(history[historyIndex - 1]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setNodes(history[historyIndex + 1]);
    }
  };

  // Node Actions
  const updateNode = (nodeId: string, section: string, field: string, value: any) => {
    const newNodes = nodes.map((n) => {
      if (n.id === nodeId) {
        if (section === "root") {
          return { ...n, [field]: value };
        }
        return {
          ...n,
          [section]: {
            ...(n[section] || {}),
            [field]: value,
          },
        };
      }
      return n;
    });
    pushHistory(newNodes);
  };

  const deleteNode = (nodeId: string, e?: any) => {
    e?.stopPropagation();
    // Recursively delete children
    const getDescendants = (id: string, allNodes: any[]): string[] => {
      const children = allNodes.filter((n) => n.parent_id === id);
      return [
        ...children.map((c) => c.id),
        ...children.flatMap((c) => getDescendants(c.id, allNodes)),
      ];
    };
    const toDelete = [nodeId, ...getDescendants(nodeId, nodes)];
    const newNodes = nodes.filter((n) => !toDelete.includes(n.id));
    if (selectedNodeId && toDelete.includes(selectedNodeId)) {
      setSelectedNodeId(null);
    }
    pushHistory(newNodes);
  };

  const moveNode = (nodeId: string, direction: -1 | 1, e?: any) => {
    e?.stopPropagation();
    const nodeIndex = nodes.findIndex((n) => n.id === nodeId);
    if (nodeIndex === -1) return;

    const node = nodes[nodeIndex];
    const siblings = nodes
      .filter((n) => n.parent_id === node.parent_id)
      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

    const currentIndex = siblings.findIndex((n) => n.id === nodeId);
    if (
      (direction === -1 && currentIndex === 0) ||
      (direction === 1 && currentIndex === siblings.length - 1)
    )
      return;

    const targetIndex = currentIndex + direction;
    const targetNode = siblings[targetIndex];

    const newNodes = nodes.map((n) => {
      if (n.id === node.id) return { ...n, sort_order: targetNode.sort_order || targetIndex };
      if (n.id === targetNode.id) return { ...n, sort_order: node.sort_order || currentIndex };
      return n;
    });
    pushHistory(newNodes);
  };

  const insertBlock = (blockType: string) => {
    const uid = crypto.randomUUID();
    const newNode = {
      id: uid,
      node_type: "composition", // simple fallback, ideally we get from registry
      block_type: blockType,
      parent_id: selectedNodeId || null,
      sort_order: 999,
    };
    pushHistory([...nodes, newNode]);
    toast.success("Bloco adicionado!");
  };

  const handleSelectTemplate = (template: SectionTemplate) => {
    const idMap = new Map<string, string>();
    const getNewId = (oldId: string) => {
      if (!idMap.has(oldId)) idMap.set(oldId, crypto.randomUUID());
      return idMap.get(oldId)!;
    };
    const generatedNodes = template.nodes.map((n) => ({
      ...n,
      id: getNewId(n.id!),
      parent_id: n.parent_id ? getNewId(n.parent_id) : null,
    }));
    // Determine sort_order for root nodes
    const rootNodes = nodes.filter((n) => !n.parent_id);
    const maxSort = rootNodes.length > 0 ? Math.max(...rootNodes.map((n) => n.sort_order || 0)) : 0;

    // Offset the sort order of the newly inserted root nodes
    const newNodes = generatedNodes.map((n: any) => {
      if (!n.parent_id) {
        return { ...n, sort_order: (n.sort_order || 0) + maxSort + 1 };
      }
      return n;
    });

    pushHistory([...nodes, ...newNodes]);
    setIsSectionPickerOpen(false);
    toast.success("Seção adicionada com sucesso!");
  };

  const reorderNodeAbsolute = (sourceId: string, targetId: string) => {
    // Basic drag and drop: move source inside target if target is section/
    const targetNode = nodes.find((n) => n.id === targetId);
    if (!targetNode || (targetNode.node_type !== "section" && targetNode.node_type !== "")) {
      return;
    }
    const newNodes = nodes.map((n) => {
      if (n.id === sourceId) {
        return { ...n, parent_id: targetId, sort_order: 999 };
      }
      return n;
    });
    pushHistory(newNodes);
  };

  // Build tree for Renderer
  const buildTree = (flatNodes: any[], parentId: string | null = null): any[] => {
    return flatNodes
      .filter((n) => (parentId === null ? !n.parent_id : n.parent_id === parentId))
      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
      .map((node) => ({
        ...node,
        children: buildTree(flatNodes, node.id),
      }));
  };
  const treeNodes = buildTree(nodes);

  // Backend Integrations
  const handleSave = async () => {
    if (!version) return;
    setIsSaving(true);
    try {
      const res = await saveBuilderNodes({
        data: {
          version_id: version.id,
          nodes: nodes,
        },
      });
      if (res.status === "success" && res.version_id) {
        setVersion({ ...version, id: res.version_id });
      }
      toast.success("Rascunho salvo com sucesso.");
    } catch (e: unknown) {
      toast.error((e instanceof Error ? e.message : String(e)) || "Erro ao salvar.");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!version) return;
    setIsPublishing(true);
    try {
      // It auto-saves during publish if needed, or we just pass current nodes
      await publishBuilderVersion({
        data: {
          version_id: version.id,
          nodes: nodes,
        },
      });
      toast.success("Página publicada com sucesso!");
    } catch (e: unknown) {
      toast.error((e instanceof Error ? e.message : String(e)) || "Erro ao publicar.");
    } finally {
      setIsPublishing(false);
    }
  };

  const selectedNode = selectedNodeId ? nodes.find((n) => n.id === selectedNodeId) : null;
  const blockManifest = selectedNode ? builderRegistry[selectedNode.block_type] : null;

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#0d0d0d]">
      <BuilderTopBar
        document={document}
        version={version}
        viewport={viewport}
        setViewport={setViewport}
        undo={undo}
        redo={redo}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        setIsTemplateModalOpen={setIsTemplateModalOpen}
        handleSave={handleSave}
        handlePublish={handlePublish}
        isSaving={isSaving}
        isPublishing={isPublishing}
        previewUrl={`/vitrine?preview=${document.id}`}
      />

      <div className="flex-1 flex overflow-hidden">
        <BuilderLeftPanel
          activePanel={activeLeftPanel}
          setActivePanel={setActiveLeftPanel}
          blockCategory={blockCategory}
          setBlockCategory={setBlockCategory}
          insertBlock={insertBlock}
          nodes={nodes}
          treeNodes={treeNodes}
          selectedNodeId={selectedNodeId}
          setSelectedNodeId={setSelectedNodeId}
          moveNode={moveNode}
          deleteNode={deleteNode}
          reorderNodeAbsolute={reorderNodeAbsolute}
          onAddSection={() => setIsSectionPickerOpen(true)}
        />

        <BuilderCanvas
          viewport={viewport}
          nodesCount={nodes.length}
          treeNodes={treeNodes}
          selectedNodeId={selectedNodeId}
          setSelectedNodeId={setSelectedNodeId}
          onAddSection={() => setIsSectionPickerOpen(true)}
        />

        {selectedNodeId && selectedNode && (
          <BuilderInspector
            selectedNodeId={selectedNodeId}
            selectedNode={selectedNode}
            blockManifest={blockManifest}
            inspectorTab={inspectorTab}
            setInspectorTab={setInspectorTab}
            setSelectedNodeId={setSelectedNodeId}
            updateNode={updateNode}
            setNodes={(updateFn: any) => {
              if (typeof updateFn === "function") {
                pushHistory(updateFn(nodes));
              } else {
                pushHistory(updateFn);
              }
            }}
            collections={initialData.collections}
            categories={initialData.categories}
            treeNodes={treeNodes}
          />
        )}
      </div>

      <GuidedSectionPicker
        isOpen={isSectionPickerOpen}
        onClose={() => setIsSectionPickerOpen(false)}
        onSelectTemplate={handleSelectTemplate}
      />
    </div>
  );
}
