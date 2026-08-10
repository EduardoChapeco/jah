import * as React from "react";
import { useState } from "react";
import { X, Search } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { getAllTemplates, getTemplatesByCategory } from "@/lib/section-templates";
import type { SectionTemplate } from "@/lib/builder-types";

export interface GuidedSectionPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: SectionTemplate) => void;
}

const CATEGORIES = [
  { id: "all", label: "Todas" },
  { id: "commerce", label: "Vitrine & Vendas" },
  { id: "content", label: "Conteúdo & Mídia" },
  { id: "marketing", label: "Marketing & Engajamento" },
];

export function GuidedSectionPicker({
  isOpen,
  onClose,
  onSelectTemplate,
}: GuidedSectionPickerProps) {
  const [activeCategory, setActiveCategory] = useState("all");
  const [search, setSearch] = useState("");

  if (!isOpen) return null;

  const templates =
    activeCategory === "all" ? getAllTemplates() : getTemplatesByCategory(activeCategory);

  const filteredTemplates = templates.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 md:p-8 animate-in fade-in">
      <div className="bg-[#18181b] border border-white/10 w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-[#121214]">
          <div>
            <h3 className="text-xl font-bold text-white">Adicionar Nova Seção</h3>
            <p className="text-sm text-white/60 mt-1">
              Escolha uma estrutura pré-montada. Você pode editar textos, cores e dados em seguida.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters & Search */}
        <div className="p-4 border-b border-white/10 flex flex-col sm:flex-row gap-4 items-center justify-between bg-[#1a1a1a]">
          <div className="flex gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0 hide-scrollbar">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={cn(
                  "px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors",
                  activeCategory === cat.id
                    ? "bg-white text-black"
                    : "bg-white/5 text-white/60 hover:text-white hover:bg-white/10 border border-white/10",
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <Input
              placeholder="Buscar seção..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#242427] border-white/10 text-white pl-9 h-9 text-xs focus-visible:ring-1 focus-visible:ring-white/30"
            />
          </div>
        </div>

        {/* Templates Grid */}
        <ScrollArea className="flex-1 p-6">
          {filteredTemplates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-white/40">
              <p>Nenhuma seção encontrada.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredTemplates.map((template) => (
                <div
                  key={template.id}
                  className="bg-[#242427] border border-white/10 overflow-hidden flex flex-col hover:border-white/30 transition-all group cursor-pointer"
                  onClick={() => onSelectTemplate(template)}
                >
                  <div className="relative aspect-video bg-muted overflow-hidden">
                    <img
                      src={template.previewImageUrl}
                      alt={template.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Button
                        variant="secondary"
                        className="scale-90 group-hover:scale-100 transition-transform"
                      >
                        Usar Esta Seção
                      </Button>
                    </div>
                  </div>
                  <div className="p-4 flex-1 flex flex-col">
                    <h4 className="font-bold text-white text-sm mb-1">{template.name}</h4>
                    <p className="text-xs text-white/60 line-clamp-2 leading-relaxed">
                      {template.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
}
