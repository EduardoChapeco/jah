import * as React from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useCallback, useRef } from "react";
import { toast } from "sonner";
import {
  getExperienceDocument,
  saveBuilderNodes,
  publishBuilderVersion,
} from "@/services/builder.functions";
import { listCategories, listCollections, listAdminProducts } from "@/services/admin-catalog.functions";
import { BuilderTopBar } from "@/components/admin/builder/builder-top-bar";
import { BuilderDockedRail, type DockedRailActivePanel } from "@/components/admin/builder/builder-docked-rail";
import { BuilderAddPanel3Col } from "@/components/admin/builder/builder-add-panel-3col";
import { BuilderLeftPanel } from "@/components/admin/builder/builder-left-panel";
import { BuilderCanvas, ViewportMode } from "@/components/admin/builder/builder-canvas";
import { BuilderInspector, InspectorTab } from "@/components/admin/builder/builder-inspector";
import { BuilderLayoutSwitcherModal } from "@/components/admin/builder/builder-layout-switcher-modal";
import { GuidedSectionPicker } from "@/components/admin/builder/guided-section-picker";
import type { SectionTemplate } from "@/lib/builder-types";
import { builderRegistry } from "@/lib/builder-registry";

export const Route = createFileRoute("/workspace/builder/$documentId/editor")({
  head: () => ({ meta: [{ title: "Construtor Visual de Páginas — Wix Studio Standard" }] }),
  loader: async ({ params }) => {
    const [docData, categories, collections, productsRes] = await Promise.all([
      getExperienceDocument({ data: { id: params.documentId } }),
      listCategories().catch(() => []),
      listCollections().catch(() => []),
      listAdminProducts().catch(() => []),
    ]);

    const realProducts = Array.isArray(productsRes) 
      ? productsRes 
      : ((productsRes as any)?.products || (productsRes as any)?.data || []);

    return {
      ...docData.data,
      categories: categories || [],
      collections: collections || [],
      products: realProducts,
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

  // Dados Dinâmicos em Tempo Real (Live Data Binding + Fallbacks de Alta Qualidade)
  const transientData = React.useMemo(() => {
    const realProducts = (initialData as any).products || [];
    const products =
      realProducts.length > 0
        ? realProducts
        : [
            {
              id: "demo-p1",
              title: "Jaqueta Bomber Heritage Edição Especial",
              slug: "jaqueta-bomber-heritage",
              price_cents: 38900,
              compare_at_cents: 45900,
              media: [
                {
                  url: "",
                  alt: "Jaqueta Bomber",
                },
              ],
              variants: [{ stock_on_hand: 15 }],
            },
            {
              id: "demo-p2",
              title: "Camisa Linho Pura Alfaiataria",
              slug: "camisa-linho-alfaiataria",
              price_cents: 24900,
              compare_at_cents: 29900,
              media: [
                {
                  url: "",
                  alt: "Camisa Linho",
                },
              ],
              variants: [{ stock_on_hand: 22 }],
            },
            {
              id: "demo-p3",
              title: "Tênis Minimalist Leather Casual",
              slug: "tenis-minimalist-leather",
              price_cents: 42900,
              compare_at_cents: null,
              media: [
                {
                  url: "",
                  alt: "Tênis Minimalist",
                },
              ],
              variants: [{ stock_on_hand: 18 }],
            },
            {
              id: "demo-p4",
              title: "Mochila Executiva Couro Legítimo",
              slug: "mochila-executiva-couro",
              price_cents: 49900,
              compare_at_cents: 59900,
              media: [
                {
                  url: "",
                  alt: "Mochila Executiva",
                },
              ],
              variants: [{ stock_on_hand: 8 }],
            },
          ];

    return {
      products,
      collections: (initialData as any).collections || [],
      categories: (initialData as any).categories || [],
      store: (initialData as any).store || {
        name: document?.title || "Sua Vitrine Conceito",
        description: "Experiência de compras com qualidade, design e atendimento premium.",
      },
      store_hero: {
        name: document?.title || "Sua Vitrine Conceito",
        description: "Experiência de compras com qualidade, design e atendimento premium.",
        cover_url:
          "",
      },
      store_contact: {
        name: document?.title || "Sua Vitrine Conceito",
        phone: "(11) 99999-8888",
        whatsapp: "5511999998888",
        address: "Av. Paulista, 1000",
        city: "São Paulo",
        state: "SP",
      },
      store_hours: {
        is_open: true,
        status_text: "Aberto agora até às 20:00",
      },
      banners: [
        {
          title: "Nova Coleção Exclusiva",
          subtitle: "Design contemporâneo e tecidos de alto padrão.",
          image_url:
            "",
          mobile_image_url:
            "",
          link: "#",
          button_text: "Explorar Coleção",
        },
      ],
    };
  }, [initialData, document]);

  // History State
  const [history, setHistory] = useState<any[][]>([initialData.nodes || []]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // UI State (Wix Studio Standard)
  const [dockedPanel, setDockedPanel] = useState<DockedRailActivePanel>(null);
  const [viewport, setViewport] = useState<ViewportMode>("desktop");
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [inspectorTab, setInspectorTab] = useState<InspectorTab>("content");
  const [blockCategory, setBlockCategory] = useState("hero");

  // Modals & Panels
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isLayoutSwitcherOpen, setIsLayoutSwitcherOpen] = useState(false);
  const [isLegacySectionPickerOpen, setIsLegacySectionPickerOpen] = useState(false);

  // Saving & Publishing State
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  // History Actions
  const pushHistory = useCallback(
    (newNodes: any[]) => {
      setHistory((prev) => {
        const newHistory = prev.slice(0, historyIndex + 1);
        newHistory.push(newNodes);
        return newHistory.slice(-30);
      });
      setHistoryIndex((prev) => Math.min(prev + 1, 29));
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

  // Node Mutations
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
    toast.success("Bloco removido.");
  };

  const duplicateNode = (nodeId: string) => {
    const nodeToClone = nodes.find((n) => n.id === nodeId);
    if (!nodeToClone) return;

    const idMap = new Map<string, string>();
    const getDescendants = (id: string, allNodes: any[]): any[] => {
      const children = allNodes.filter((n) => n.parent_id === id);
      return [...children, ...children.flatMap((c) => getDescendants(c.id, allNodes))];
    };

    const treeToClone = [nodeToClone, ...getDescendants(nodeId, nodes)];
    treeToClone.forEach((n) => idMap.set(n.id, crypto.randomUUID()));

    const clonedNodes = treeToClone.map((n) => ({
      ...n,
      id: idMap.get(n.id)!,
      parent_id: n.parent_id === nodeToClone.parent_id ? nodeToClone.parent_id : idMap.get(n.parent_id) || null,
      sort_order: (n.sort_order || 0) + 1,
    }));

    const newNodes = [...nodes, ...clonedNodes];
    pushHistory(newNodes);
    setSelectedNodeId(clonedNodes[0].id);
    toast.success("Bloco duplicado com sucesso!");
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
      if (n.id === node.id) return { ...n, sort_order: targetNode.sort_order };
      if (n.id === targetNode.id) return { ...n, sort_order: node.sort_order };
      return n;
    });

    pushHistory(newNodes);
  };

  const reorderNodeAbsolute = (draggedId: string, targetId: string) => {
    const draggedNode = nodes.find((n) => n.id === draggedId);
    const targetNode = nodes.find((n) => n.id === targetId);
    if (!draggedNode || !targetNode) return;

    const newParentId = targetNode.parent_id;
    const newSortOrder = (targetNode.sort_order || 0) + 1;

    const newNodes = nodes.map((n) => {
      if (n.id === draggedId) {
        return { ...n, parent_id: newParentId, sort_order: newSortOrder };
      }
      if (n.parent_id === newParentId && (n.sort_order || 0) >= newSortOrder && n.id !== draggedId) {
        return { ...n, sort_order: (n.sort_order || 0) + 1 };
      }
      return n;
    });

    pushHistory(newNodes);
  };

  // Inserção de Seção Completa (Template) com Mapeamento Canônico de Nós
  const handleSelectTemplate = (template: SectionTemplate) => {
    if (!template || !Array.isArray(template.nodes) || template.nodes.length === 0) {
      toast.error("Modelo de seção inválido ou vazio.");
      return;
    }

    const idMap = new Map<string, string>();
    template.nodes.forEach((n) => {
      if (n.id) idMap.set(n.id, crypto.randomUUID());
    });

    const highestSortOrder = nodes
      .filter((n) => n.parent_id === null)
      .reduce((max, n) => Math.max(max, n.sort_order || 0), 0);

    const newSectionNodes = template.nodes.map((n) => {
      const newId = idMap.get(n.id!) ?? crypto.randomUUID();
      const newParentId = n.parent_id ? idMap.get(n.parent_id) || null : null;
      return {
        ...n,
        id: newId,
        version_id: version?.id,
        parent_id: newParentId,
        content: n.content ? { ...n.content } : {},
        design_tokens: n.design_tokens ? { ...n.design_tokens } : {},
        layout_rules: n.layout_rules ? { ...n.layout_rules } : {},
        data_bindings: n.data_bindings ? { ...n.data_bindings } : {},
        sort_order: newParentId === null ? highestSortOrder + 1 : n.sort_order || 0,
      };
    });

    const updatedNodes = [...nodes, ...newSectionNodes];
    pushHistory(updatedNodes);
    setSelectedNodeId(newSectionNodes[0].id);
    toast.success(`Seção "${template.name}" inserida com sucesso!`);
  };

  // Inserção de Bloco Individual
  const insertBlock = (blockType: string) => {
    const reg = builderRegistry[blockType];
    if (!reg) return;

    const sectionId = crypto.randomUUID();
    const containerId = crypto.randomUUID();
    const elementId = crypto.randomUUID();

    const highestSortOrder = nodes
      .filter((n) => n.parent_id === null)
      .reduce((max, n) => Math.max(max, n.sort_order || 0), 0);

    const newNodes = [
      {
        id: sectionId,
        node_type: "section",
        block_type: "section",
        parent_id: null,
        sort_order: highestSortOrder + 1,
        content: {},
        layout_rules: { maxWidth: "full", paddingY: "md" },
        design_tokens: {},
      },
      {
        id: containerId,
        node_type: "container",
        block_type: "container",
        parent_id: sectionId,
        sort_order: 0,
        content: {},
        layout_rules: { maxWidth: "6xl", paddingX: "md", paddingY: "md" },
        design_tokens: {},
      },
      {
        id: elementId,
        node_type: reg.defaultProps?.node_type || "element",
        block_type: blockType,
        parent_id: containerId,
        sort_order: 0,
        content: (reg.defaultProps?.content as Record<string, unknown>) || {},
        layout_rules: (reg.defaultProps?.layout_rules as Record<string, unknown>) || {},
        design_tokens: (reg.defaultProps?.design_tokens as Record<string, unknown>) || {},
      },
    ];

    pushHistory([...nodes, ...newNodes]);
    setSelectedNodeId(elementId);
    setDockedPanel(null);
    toast.success(`Bloco "${reg.name}" adicionado à página!`);
  };

  // Alterar Layout da Seção (Wix Pro Gallery Standard)
  const handleApplyLayout = (layoutVariant: string) => {
    if (!selectedNodeId) return;
    updateNode(selectedNodeId, "layout_rules", "variant", layoutVariant);
    toast.success(`Layout atualizado para ${layoutVariant.toUpperCase()}!`);
  };

  // Salvamento e Publicação no Supabase
  const handleSave = async () => {
    if (!version?.id) {
      toast.error("Versão do documento não encontrada.");
      return;
    }
    const versionId: string = version.id;
    setIsSaving(true);
    try {
      await saveBuilderNodes({
        data: {
          version_id: versionId,
          nodes,
        },
      });
      toast.success("Rascunho salvo com sucesso no banco!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar rascunho.");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!version?.id) return;
    const versionId: string = version.id;
    setIsPublishing(true);
    try {
      // 1. Salva estado atual
      await saveBuilderNodes({
        data: {
          version_id: versionId,
          nodes,
        },
      });

      // 2. Publica versão
      await publishBuilderVersion({
        data: { version_id: versionId, nodes },
      });

      setVersion((prev: any) => ({ ...prev, status: "published" }));
      toast.success("Vitrine publicada com sucesso! As alterações já estão ativas para os visitantes.");
    } catch (err: any) {
      toast.error(err.message || "Erro ao publicar versão.");
    } finally {
      setIsPublishing(false);
    }
  };

  // Montagem da Árvore Hierárquica para Renderização
  const buildTree = (allNodes: any[]) => {
    const nodeMap = new Map<string, any>();
    allNodes.forEach((n) => nodeMap.set(n.id, { ...n, children: [] }));

    const roots: any[] = [];
    nodeMap.forEach((n) => {
      if (n.parent_id && nodeMap.has(n.parent_id)) {
        nodeMap.get(n.parent_id)!.children.push(n);
      } else {
        roots.push(n);
      }
    });

    const sortRec = (list: any[]) => {
      list.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
      list.forEach((c) => {
        if (c.children && c.children.length > 0) sortRec(c.children);
      });
    };
    sortRec(roots);
    return roots;
  };

  const treeNodes = React.useMemo(() => buildTree(nodes), [nodes]);
  const selectedNode = selectedNodeId ? nodes.find((n) => n.id === selectedNodeId) : null;
  const selectedBlockManifest = selectedNode ? (builderRegistry as any)[selectedNode.block_type] : null;

  return (
    <div className="flex flex-col h-screen w-screen bg-background overflow-hidden select-none font-sans">
      {/* ── 1. BARRA SUPERIOR CANÔNICA (Wix Studio / Editor X Standard) ── */}
      <BuilderTopBar
        document={document}
        version={version}
        viewport={viewport}
        setViewport={setViewport}
        undo={undo}
        redo={redo}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        previewUrl={document?.slug ? (document.document_type === "storefront" ? "/perfil-da-loja" : `/paginas/${document.slug}`) : "/perfil-da-loja"}
        setIsTemplateModalOpen={() => setDockedPanel("add")}
        handleSave={handleSave}
        handlePublish={handlePublish}
        isSaving={isSaving}
        isPublishing={isPublishing}
      />

      {/* ── 2. ÁREA PRINCIPAL: DOCKED RAIL + GAVETAS + CANVAS + INSPETOR ── */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Trilho de Ícones Fino 48px */}
        <BuilderDockedRail
          activePanel={dockedPanel}
          onTogglePanel={(p) => setDockedPanel(p)}
          nodesCount={nodes.length}
        />

        {/* Drawer 3-Colunas "Adicionar ao Site" (Wix Studio Imagem 3) */}
        <BuilderAddPanel3Col
          isOpen={dockedPanel === "add"}
          onClose={() => setDockedPanel(null)}
          onSelectTemplate={handleSelectTemplate}
          onInsertSingleBlock={insertBlock}
        />

        {/* Painel de Camadas / Árvore de Elementos */}
        {dockedPanel === "layers" && (
          <BuilderLeftPanel
            activePanel="layers"
            setActivePanel={() => {}}
            nodesCount={nodes.length}
            treeNodes={treeNodes}
            selectedNodeId={selectedNodeId}
            setSelectedNodeId={setSelectedNodeId}
            moveNode={(id, dir, e) => moveNode(id, dir, e)}
            deleteNode={(id, e) => deleteNode(id, e)}
            reorderNodeAbsolute={reorderNodeAbsolute}
            blockCategory={blockCategory}
            setBlockCategory={setBlockCategory}
            insertBlock={insertBlock}
            insertSectionPreset={() => {}}
            onAddSection={() => setDockedPanel("add")}
          />
        )}

        {/* Canvas de Edição Central Studio com Live Data Binding */}
        <BuilderCanvas
          viewport={viewport}
          nodesCount={nodes.length}
          treeNodes={treeNodes}
          selectedNodeId={selectedNodeId}
          setSelectedNodeId={setSelectedNodeId}
          onAddSection={() => setDockedPanel("add")}
          onEditContent={() => setInspectorTab("content")}
          onChangeLayout={() => setIsLayoutSwitcherOpen(true)}
          onDuplicateNode={duplicateNode}
          onDeleteNode={deleteNode}
          onMoveNode={(id, dir) => moveNode(id, dir)}
          pageSlug={document?.slug || "vitrine"}
          transientData={transientData}
        />

        {/* Painel Inspetor à Direita (Editor X Standard - Imagem 4) */}
        <BuilderInspector
          selectedNodeId={selectedNodeId}
          selectedNode={selectedNode}
          blockManifest={selectedBlockManifest}
          inspectorTab={inspectorTab}
          setInspectorTab={setInspectorTab}
          setSelectedNodeId={setSelectedNodeId}
          updateNode={updateNode}
          setNodes={setNodes}
          collections={initialData.collections || []}
          categories={initialData.categories || []}
          treeNodes={treeNodes}
        />
      </div>

      {/* ── 3. MODAL SELETOR DE LAYOUTS DE GRID (Wix Pro Gallery - Imagem 2) ── */}
      <BuilderLayoutSwitcherModal
        isOpen={isLayoutSwitcherOpen}
        onClose={() => setIsLayoutSwitcherOpen(false)}
        currentNode={selectedNode}
        onApplyLayout={handleApplyLayout}
      />
    </div>
  );
}
