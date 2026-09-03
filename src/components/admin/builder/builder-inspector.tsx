import * as React from "react";
import {
  X,
  Sliders,
  Database,
  Palette,
  Layout,
  Maximize2,
  Minimize2,
  Move,
  Type,
  Square,
  Sparkles,
  Link,
  CheckCircle2,
  Layers,
  Image as ImageIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MediaUploader } from "@/components/admin/builder/MediaUploader";
import { ColorPicker } from "@/components/admin/builder/ColorPicker";
import { ArrayBuilder } from "@/components/admin/builder/ArrayBuilder";
import { BuilderDockingMatrix, type DockingPosition } from "@/components/admin/builder/builder-docking-matrix";
import type { ExperienceNode } from "@/lib/builder-types";
import { builderRegistry } from "@/lib/builder-registry";

export type InspectorTab = "content" | "connection" | "layout" | "design";

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
  if (!selectedNode || !blockManifest) {
    return (
      <aside className="w-80 bg-card border-l border-border/80 flex flex-col flex-none overflow-hidden select-none z-20 shadow-2xs">
        <div className="p-8 flex flex-col items-center justify-center flex-1 text-center space-y-3 text-muted-foreground">
          <div className="size-12 rounded-2xl bg-muted/40 flex items-center justify-center border border-border/60">
            <Sliders className="size-5 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-foreground">Nenhum bloco selecionado</h4>
            <p className="text-[11px] text-muted-foreground max-w-[200px] leading-relaxed">
              Clique em qualquer seção ou bloco no canvas para editar textos, imagens, layout e dados em tempo real.
            </p>
          </div>
        </div>
      </aside>
    );
  }

  const content = selectedNode.content || {};
  const layout = selectedNode.layout_rules || {};
  const design = selectedNode.design_tokens || {};
  const dataBindings = selectedNode.data_bindings || {};

  const humanizeLabel = (key: string) => {
    return key
      .replace(/_/g, " ")
      .replace(/([A-Z])/g, " $1")
      .replace(/^\w/, (l) => l.toUpperCase())
      .replace("Cents", " (R$)")
      .replace("Url", " (Imagem / Link)")
      .replace("Autoplay", "Reprodução Automática")
      .replace("Interval", "Intervalo de Troca (s)");
  };

  const handleContentChange = (field: string, value: any) => {
    updateNode(selectedNode.id, "content", field, value);
  };

  const handleLayoutChange = (field: string, value: any) => {
    updateNode(selectedNode.id, "layout_rules", field, value);
  };

  const handleDesignChange = (field: string, value: any) => {
    updateNode(selectedNode.id, "design_tokens", field, value);
  };

  const handleBindingChange = (sourceType: string, extra: Record<string, any> = {}) => {
    setNodes((prev: any[]) =>
      prev.map((n) => {
        if (n.id === selectedNode.id) {
          return {
            ...n,
            data_bindings: sourceType === "none" ? {} : { source: sourceType, ...extra },
          };
        }
        return n;
      })
    );
  };

  // Inspect content fields from manifest with full resilience
  const manifestContentFields =
    blockManifest.inspector?.content ||
    blockManifest.content_fields ||
    (blockManifest.contentSchema ? [] : null);

  return (
    <aside className="w-80 bg-card border-l border-border/80 flex flex-col flex-none overflow-hidden select-none z-20 shadow-2xs">
      {/* ── Topo do Inspetor: Identificação Canônica do Bloco ── */}
      <div className="p-3.5 border-b border-border/70 flex items-center justify-between bg-muted/20">
        <div className="space-y-0.5 min-w-0 pr-2">
          <div className="flex items-center gap-1.5">
            <h3 className="text-xs font-bold text-foreground truncate">
              {blockManifest.name}
            </h3>
            <Badge variant="outline" className="text-[9px] px-1.5 py-0 font-mono">
              {selectedNode.block_type}
            </Badge>
          </div>
          <p className="text-[10px] text-muted-foreground line-clamp-1">
            {blockManifest.description || "Propriedades e estilo do bloco."}
          </p>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => setSelectedNodeId(null)}
          className="size-7 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer shrink-0"
        >
          <X className="size-3.5" />
        </Button>
      </div>

      {/* ── Abas do Inspetor (Wix Studio / Editor X Standard) ── */}
      <div className="flex p-1 bg-muted/40 border-b border-border/60 gap-1 text-[11px] font-semibold">
        <button
          type="button"
          onClick={() => setInspectorTab("content")}
          className={cn(
            "flex-1 py-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1",
            inspectorTab === "content"
              ? "bg-background text-foreground font-bold shadow-2xs"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Sliders className="size-3" />
          <span>Conteúdo</span>
        </button>

        <button
          type="button"
          onClick={() => setInspectorTab("layout")}
          className={cn(
            "flex-1 py-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1",
            inspectorTab === "layout"
              ? "bg-background text-foreground font-bold shadow-2xs"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Layout className="size-3" />
          <span>Layout</span>
        </button>

        <button
          type="button"
          onClick={() => setInspectorTab("design")}
          className={cn(
            "flex-1 py-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1",
            inspectorTab === "design"
              ? "bg-background text-foreground font-bold shadow-2xs"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Palette className="size-3" />
          <span>Estilo</span>
        </button>

        <button
          type="button"
          onClick={() => setInspectorTab("connection")}
          className={cn(
            "flex-1 py-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1",
            inspectorTab === "connection"
              ? "bg-background text-foreground font-bold shadow-2xs"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Database className="size-3" />
          <span>Dados</span>
        </button>
      </div>

      {/* ── Conteúdo da Aba Ativa ── */}
      <ScrollArea className="flex-1 p-4">
        {/* ── 1. ABA CONTEÚDO (FIELDS DO MANIFEST OU AUTO-GENERATED) ── */}
        {inspectorTab === "content" && (
          <div className="space-y-4 pb-8">
            {manifestContentFields && manifestContentFields.length > 0 ? (
              manifestContentFields.map((field: any) => {
                const val = content[field.name] ?? field.defaultValue ?? field.default ?? "";

                if (field.type === "string" || field.type === "text") {
                  return (
                    <div key={field.name} className="space-y-1.5">
                      <Label className="text-xs font-bold text-foreground">
                        {field.label || humanizeLabel(field.name)}
                      </Label>
                      <Input
                        value={val}
                        onChange={(e) => handleContentChange(field.name, e.target.value)}
                        className="h-9 rounded-xl text-xs bg-background"
                        placeholder={field.placeholder || ""}
                      />
                    </div>
                  );
                }

                if (field.type === "textarea") {
                  return (
                    <div key={field.name} className="space-y-1.5">
                      <Label className="text-xs font-bold text-foreground">
                        {field.label || humanizeLabel(field.name)}
                      </Label>
                      <Textarea
                        value={val}
                        onChange={(e) => handleContentChange(field.name, e.target.value)}
                        className="rounded-xl text-xs min-h-[70px] bg-background"
                        placeholder={field.placeholder || ""}
                      />
                    </div>
                  );
                }

                if (field.type === "image" || field.type === "media") {
                  return (
                    <div key={field.name} className="space-y-1.5">
                      <Label className="text-xs font-bold text-foreground">
                        {field.label || humanizeLabel(field.name)}
                      </Label>
                      <MediaUploader
                        value={val}
                        onChange={(url) => handleContentChange(field.name, url)}
                        bucket="cms-media"
                      />
                    </div>
                  );
                }

                if (field.type === "boolean") {
                  return (
                    <div key={field.name} className="flex items-center justify-between p-2.5 rounded-xl bg-muted/30 border border-border/50">
                      <Label className="text-xs font-bold text-foreground cursor-pointer">
                        {field.label || humanizeLabel(field.name)}
                      </Label>
                      <Switch
                        checked={!!val}
                        onCheckedChange={(checked) => handleContentChange(field.name, checked)}
                      />
                    </div>
                  );
                }

                if (field.type === "number") {
                  return (
                    <div key={field.name} className="space-y-1.5">
                      <Label className="text-xs font-bold text-foreground">
                        {field.label || humanizeLabel(field.name)}
                      </Label>
                      <Input
                        type="number"
                        value={val}
                        onChange={(e) => handleContentChange(field.name, Number(e.target.value))}
                        className="h-9 rounded-xl text-xs font-mono bg-background"
                      />
                    </div>
                  );
                }

                if (field.type === "select" && field.options) {
                  return (
                    <div key={field.name} className="space-y-1.5">
                      <Label className="text-xs font-bold text-foreground">
                        {field.label || humanizeLabel(field.name)}
                      </Label>
                      <Select
                        value={val || field.options[0]?.value}
                        onValueChange={(newVal) => handleContentChange(field.name, newVal)}
                      >
                        <SelectTrigger className="h-9 rounded-xl text-xs bg-background">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {field.options.map((opt: any) => (
                            <SelectItem key={opt.value} value={opt.value} className="text-xs">
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  );
                }

                if (field.type === "array") {
                  return (
                    <div key={field.name} className="space-y-2 pt-1 border-t border-border/50">
                      <Label className="text-xs font-bold text-foreground">
                        {field.label || humanizeLabel(field.name)}
                      </Label>
                      <ArrayBuilder
                        value={Array.isArray(val) ? val : []}
                        onChange={(arr) => handleContentChange(field.name, arr)}
                        arrayFields={field.arrayFields || field.array_fields || []}
                        label={field.label}
                      />
                    </div>
                  );
                }

                return null;
              })
            ) : (
              /* Fallback para nós com conteúdo dinâmico livre */
              <div className="space-y-3">
                {Object.keys(content).length === 0 && (
                  <p className="text-xs text-muted-foreground italic text-center py-4">
                    Este bloco utiliza dados dinâmicos do catálogo ou layout automático.
                  </p>
                )}
                {Object.entries(content).map(([k, v]) => {
                  if (typeof v === "boolean") {
                    return (
                      <div key={k} className="flex items-center justify-between p-2.5 rounded-xl bg-muted/30 border border-border/50">
                        <Label className="text-xs font-bold text-foreground">{humanizeLabel(k)}</Label>
                        <Switch checked={v} onCheckedChange={(c) => handleContentChange(k, c)} />
                      </div>
                    );
                  }

                  if (typeof v === "string" && (k.toLowerCase().includes("image") || k.toLowerCase().includes("cover") || k.toLowerCase().includes("banner"))) {
                    return (
                      <div key={k} className="space-y-1.5">
                        <Label className="text-xs font-bold text-foreground">{humanizeLabel(k)}</Label>
                        <MediaUploader value={v} onChange={(url) => handleContentChange(k, url)} bucket="cms-media" />
                      </div>
                    );
                  }

                  if (typeof v === "string" && v.length > 60) {
                    return (
                      <div key={k} className="space-y-1.5">
                        <Label className="text-xs font-bold text-foreground">{humanizeLabel(k)}</Label>
                        <Textarea value={v} onChange={(e) => handleContentChange(k, e.target.value)} className="rounded-xl text-xs min-h-[70px] bg-background" />
                      </div>
                    );
                  }

                  if (typeof v === "string" || typeof v === "number") {
                    return (
                      <div key={k} className="space-y-1.5">
                        <Label className="text-xs font-bold text-foreground">{humanizeLabel(k)}</Label>
                        <Input value={v} onChange={(e) => handleContentChange(k, e.target.value)} className="h-9 rounded-xl text-xs bg-background" />
                      </div>
                    );
                  }

                  if (Array.isArray(v)) {
                    return (
                      <div key={k} className="space-y-2 pt-2 border-t border-border/50">
                        <Label className="text-xs font-bold text-foreground">{humanizeLabel(k)}</Label>
                        <ArrayBuilder
                          value={v}
                          onChange={(arr) => handleContentChange(k, arr)}
                          arrayFields={[
                            { name: "title", label: "Título", type: "text" },
                            { name: "subtitle", label: "Subtítulo", type: "text" },
                            { name: "image_url", label: "Imagem", type: "image" },
                            { name: "link", label: "Link", type: "text" },
                          ]}
                        />
                      </div>
                    );
                  }

                  return null;
                })}
              </div>
            )}
          </div>
        )}

        {/* ── 2. ABA LAYOUT, DIMENSÕES & DOCKING ── */}
        {inspectorTab === "layout" && (
          <div className="space-y-5 pb-8">
            <div className="space-y-3 p-3.5 rounded-2xl bg-muted/20 border border-border/60">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Dimensões (Size)
                </span>
                <Badge variant="outline" className="text-[10px]">
                  {layout.sizingMode || "Fluid %"}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleLayoutChange("sizingMode", "fluid")}
                  className={cn(
                    "py-1.5 rounded-lg text-xs font-semibold transition-all border cursor-pointer",
                    (layout.sizingMode || "fluid") === "fluid"
                      ? "bg-primary text-primary-foreground font-bold shadow-2xs border-primary"
                      : "bg-card border-border/70 text-muted-foreground hover:text-foreground"
                  )}
                >
                  Fluido (100%)
                </button>
                <button
                  type="button"
                  onClick={() => handleLayoutChange("sizingMode", "fixed")}
                  className={cn(
                    "py-1.5 rounded-lg text-xs font-semibold transition-all border cursor-pointer",
                    layout.sizingMode === "fixed"
                      ? "bg-primary text-primary-foreground font-bold shadow-2xs border-primary"
                      : "bg-card border-border/70 text-muted-foreground hover:text-foreground"
                  )}
                >
                  Fixo (px)
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <div className="space-y-1">
                  <Label className="text-[11px] font-bold">Largura Máx</Label>
                  <Select
                    value={layout.maxWidth || "full"}
                    onValueChange={(val) => handleLayoutChange("maxWidth", val)}
                  >
                    <SelectTrigger className="h-8 rounded-lg text-xs bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full">100% (Full Width)</SelectItem>
                      <SelectItem value="6xl">Canônico (max-w-6xl)</SelectItem>
                      <SelectItem value="4xl">Médio (max-w-4xl)</SelectItem>
                      <SelectItem value="2xl">Compacto (max-w-2xl)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] font-bold">Espaçamento Y</Label>
                  <Select
                    value={layout.paddingY || "md"}
                    onValueChange={(val) => handleLayoutChange("paddingY", val)}
                  >
                    <SelectTrigger className="h-8 rounded-lg text-xs bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sem Espaço (0px)</SelectItem>
                      <SelectItem value="sm">Pequeno (16px)</SelectItem>
                      <SelectItem value="md">Médio (32px)</SelectItem>
                      <SelectItem value="lg">Amplo (64px)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <BuilderDockingMatrix
              value={layout.docking || "center"}
              onChange={(pos) => handleLayoutChange("docking", pos)}
            />
          </div>
        )}

        {/* ── 3. ABA ESTILO & DESIGN ── */}
        {inspectorTab === "design" && (
          <div className="space-y-4 pb-8">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">Cor de Fundo da Seção</Label>
              <ColorPicker
                value={design.backgroundColor || "#ffffff"}
                onChange={(c) => handleDesignChange("backgroundColor", c)}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">Cor do Texto</Label>
              <ColorPicker
                value={design.textColor || "#09090b"}
                onChange={(c) => handleDesignChange("textColor", c)}
              />
            </div>

            <div className="space-y-1.5 pt-2 border-t border-border/60">
              <Label className="text-xs font-bold text-foreground">Imagem de Fundo (Cover)</Label>
              <MediaUploader
                value={design.backgroundImage || ""}
                onChange={(url) => handleDesignChange("backgroundImage", url)}
                bucket="cms-media"
              />
            </div>

            <div className="space-y-1.5 pt-2 border-t border-border/60">
              <Label className="text-xs font-bold text-foreground">Estilo do Papel / Fundo</Label>
              <Select
                value={design.surfaceVariant || "default"}
                onValueChange={(val) => handleDesignChange("surfaceVariant", val)}
              >
                <SelectTrigger className="h-9 rounded-xl text-xs bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Padrão</SelectItem>
                  <SelectItem value="none">Transparente</SelectItem>
                  <SelectItem value="flat">Flat Sólido</SelectItem>
                  <SelectItem value="muted">Muted Suave</SelectItem>
                  <SelectItem value="zine">Zine (Rasgado)</SelectItem>
                  <SelectItem value="ticket">Ticket (Ingresso)</SelectItem>
                  <SelectItem value="journal">Journal (Papel Jornal)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* ── 4. ABA CONEXÃO DE DADOS (LIVE DATA BINDING) ── */}
        {inspectorTab === "connection" && (
          <div className="space-y-5 pb-8">
            <div className="p-3.5 rounded-2xl bg-muted/20 border border-border/60 space-y-3">
              <div className="flex items-center gap-2">
                <Database className="size-4 text-primary" />
                <span className="text-xs font-bold text-foreground">Fonte de Dados Dinâmica</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Conecte este bloco ao banco de dados para sincronizar produtos, avaliações, horários ou informações da loja automaticamente.
              </p>

              <div className="space-y-2">
                <Label className="text-xs font-bold">Fonte</Label>
                <Select
                  value={dataBindings.source || "none"}
                  onValueChange={(val) => handleBindingChange(val)}
                >
                  <SelectTrigger className="h-9 rounded-xl text-xs bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhuma (Conteúdo Manual Estático)</SelectItem>
                    <SelectItem value="dynamic_products">Produtos Mais Vendidos (Hits)</SelectItem>
                    <SelectItem value="latest_products">Últimos Lançamentos</SelectItem>
                    <SelectItem value="product_collection">Coleção Específica</SelectItem>
                    <SelectItem value="dynamic_reviews">Avaliações de Clientes (Reviews)</SelectItem>
                    <SelectItem value="store_profile">Dados da Loja (Nome, Logo, Capa)</SelectItem>
                    <SelectItem value="store_contact">Canais de Contato (WhatsApp / Endereço)</SelectItem>
                    <SelectItem value="store_hours">Horários de Funcionamento em Tempo Real</SelectItem>
                    <SelectItem value="marketing_banners">Banners Promocionais Cadastrados</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {dataBindings.source === "product_collection" && (
                <div className="space-y-2 pt-2 border-t border-border/50">
                  <Label className="text-xs font-bold">Selecione a Coleção</Label>
                  <Select
                    value={dataBindings.collection_slug || ""}
                    onValueChange={(slug) => handleBindingChange("product_collection", { collection_slug: slug })}
                  >
                    <SelectTrigger className="h-9 rounded-xl text-xs bg-background">
                      <SelectValue placeholder="Selecione uma coleção..." />
                    </SelectTrigger>
                    <SelectContent>
                      {collections.length === 0 ? (
                        <SelectItem value="sem-colecao" disabled>Nenhuma coleção cadastrada</SelectItem>
                      ) : (
                        collections.map((c: any) => (
                          <SelectItem key={c.id || c.slug} value={c.slug} className="text-xs">
                            {c.title || c.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {dataBindings.source && dataBindings.source !== "none" && (
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[11px] flex items-center gap-1.5">
                  <CheckCircle2 className="size-3.5 shrink-0" />
                  <span>Conectado em tempo real com o banco de dados.</span>
                </div>
              )}
            </div>
          </div>
        )}
      </ScrollArea>
    </aside>
  );
}
