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
              Clique em qualquer seção ou bloco no canvas para editar textos, layout, dimensões e dados.
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
      .replace(/\b\w/g, (l) => l.toUpperCase())
      .replace("Cents", " (R$)")
      .replace("Url", " (Link / Imagem)")
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

  const handleBindingChange = (sourceType: string, slugValue: string) => {
    setNodes((prev: any[]) =>
      prev.map((n) => {
        if (n.id === selectedNode.id) {
          return {
            ...n,
            data_bindings: slugValue
              ? { source: sourceType, collection_slug: slugValue }
              : {},
          };
        }
        return n;
      })
    );
  };

  return (
    <aside className="w-80 bg-card border-l border-border/80 flex flex-col flex-none overflow-hidden select-none z-20 shadow-2xs">
      {/* ── Topo do Inspetor: Nome do Bloco + Botão Fechar ── */}
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
            {blockManifest.description || "Propriedades e estilo da seção."}
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

      {/* ── Abas de Configuração (Editor X Standard — Imagem 4) ── */}
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
          <span>Layout & Size</span>
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

      {/* ── Corpo de Configurações ── */}
      <ScrollArea className="flex-1 p-4">
        {/* ── 1. ABA CONTEÚDO ── */}
        {inspectorTab === "content" && (
          <div className="space-y-4 pb-8">
            {blockManifest.content_fields ? (
              blockManifest.content_fields.map((field: any) => {
                const val = content[field.name] ?? field.default ?? "";

                if (field.type === "string" || field.type === "text") {
                  return (
                    <div key={field.name} className="space-y-1.5">
                      <Label className="text-xs font-bold text-foreground">
                        {field.label || humanizeLabel(field.name)}
                      </Label>
                      {field.multiline ? (
                        <Textarea
                          value={val}
                          onChange={(e) => handleContentChange(field.name, e.target.value)}
                          className="rounded-xl text-xs min-h-[70px] bg-background"
                          placeholder={field.placeholder || ""}
                        />
                      ) : (
                        <Input
                          value={val}
                          onChange={(e) => handleContentChange(field.name, e.target.value)}
                          className="h-9 rounded-xl text-xs bg-background"
                          placeholder={field.placeholder || ""}
                        />
                      )}
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

                if (field.type === "array") {
                  return (
                    <div key={field.name} className="space-y-2 pt-1 border-t border-border/50">
                      <Label className="text-xs font-bold text-foreground">
                        {field.label || humanizeLabel(field.name)}
                      </Label>
                      <ArrayBuilder
                        value={val}
                        onChange={(arr) => handleContentChange(field.name, arr)}
                        arrayFields={field.array_fields}
                      />
                    </div>
                  );
                }

                return null;
              })
            ) : (
              <div className="space-y-3">
                {Object.entries(content).map(([k, v]) => {
                  if (typeof v === "boolean") {
                    return (
                      <div key={k} className="flex items-center justify-between p-2.5 rounded-xl bg-muted/30 border border-border/50">
                        <Label className="text-xs font-bold text-foreground">
                          {humanizeLabel(k)}
                        </Label>
                        <Switch
                          checked={v}
                          onCheckedChange={(c) => handleContentChange(k, c)}
                        />
                      </div>
                    );
                  }

                  if (typeof v === "string" || typeof v === "number") {
                    return (
                      <div key={k} className="space-y-1.5">
                        <Label className="text-xs font-bold text-foreground">
                          {humanizeLabel(k)}
                        </Label>
                        <Input
                          value={v}
                          onChange={(e) => handleContentChange(k, e.target.value)}
                          className="h-9 rounded-xl text-xs bg-background"
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

        {/* ── 2. ABA LAYOUT, DIMENSÕES & DOCKING (Editor X Standard — Imagem 4) ── */}
        {inspectorTab === "layout" && (
          <div className="space-y-5 pb-8">
            {/* Seção Tamanho (Size) */}
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

            {/* Matriz de Ancoragem (Docking 9-Pontos — Imagem 4) */}
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
                value={design.textColor || "#000000"}
                onChange={(c) => handleDesignChange("textColor", c)}
              />
            </div>

            <div className="space-y-1.5 pt-2 border-t border-border/50">
              <Label className="text-xs font-bold text-foreground">Bordas Arredondadas (Radius)</Label>
              <Select
                value={design.borderRadius || "none"}
                onValueChange={(val) => handleDesignChange("borderRadius", val)}
              >
                <SelectTrigger className="h-9 rounded-xl text-xs bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Reto (0px)</SelectItem>
                  <SelectItem value="rounded-xl">Médio (12px / .squircle-soft)</SelectItem>
                  <SelectItem value="rounded-2xl">Grande (18px / .squircle-media)</SelectItem>
                  <SelectItem value="rounded-3xl">Card Canônico (24px)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* ── 4. ABA CONEXÕES (CMS & PRODUTOS) ── */}
        {inspectorTab === "connection" && (
          <div className="space-y-4 pb-8">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">Vincular Coleção do Catálogo</Label>
              <Select
                value={dataBindings.collection_slug || ""}
                onValueChange={(val) => handleBindingChange("product_collection", val)}
              >
                <SelectTrigger className="h-9 rounded-xl text-xs bg-background">
                  <SelectValue placeholder="Selecione uma coleção..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Produtos Ativos</SelectItem>
                  {collections.map((col: any) => (
                    <SelectItem key={col.id} value={col.slug}>
                      [Coleção] {col.title}
                    </SelectItem>
                  ))}
                  {categories.map((cat: any) => (
                    <SelectItem key={cat.id} value={cat.slug}>
                      [Categoria] {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                Ao selecionar uma coleção, os produtos reais cadastrados na loja serão carregados automaticamente neste bloco.
              </p>
            </div>
          </div>
        )}
      </ScrollArea>
    </aside>
  );
}
