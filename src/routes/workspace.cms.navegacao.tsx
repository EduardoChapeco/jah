import { createFileRoute, useRouter } from "@tanstack/react-router";
import { Plus, Trash2, GripVertical, Save, Link2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/commerce/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/state/states";
import { getNavigationMenus, upsertNavigationMenu } from "@/services/cms.functions";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/workspace/cms/navegacao")({
  head: () => ({ meta: [{ title: "Menus de Navegação" }] }),
  loader: async () => {
    const res = await getNavigationMenus();
    return res || [];
  },
  component: CmsNavigationPage,
});

type NavItem = {
  id: string;
  label: string;
  url: string;
};

type MenuState = {
  id?: string;
  name: string;
  handle: string;
  items: NavItem[];
};

function CmsNavigationPage() {
  const router = useRouter();
  const menus = Route.useLoaderData();

  // Create a default menu state based on loaded data or a new empty menu
  const defaultMenu = menus.find((m: any) => m.handle === "main-menu") ||
    menus[0] || { name: "Menu Principal", handle: "main-menu", items: [] };

  const [activeMenu, setActiveMenu] = useState<MenuState>({
    id: defaultMenu.id,
    name: defaultMenu.name,
    handle: defaultMenu.handle,
    items: defaultMenu.items || [],
  });

  const [isSaving, setIsSaving] = useState(false);

  const handleAddItem = () => {
    const newItem: NavItem = {
      id: Math.random().toString(36).substr(2, 9),
      label: "Novo Link",
      url: "/",
    };
    setActiveMenu({ ...activeMenu, items: [...activeMenu.items, newItem] });
  };

  const handleItemChange = (index: number, field: keyof NavItem, value: string) => {
    const newItems = [...activeMenu.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setActiveMenu({ ...activeMenu, items: newItems });
  };

  const handleRemoveItem = (index: number) => {
    const newItems = activeMenu.items.filter((_, i) => i !== index);
    setActiveMenu({ ...activeMenu, items: newItems });
  };

  const handleSave = async () => {
    if (!activeMenu.name || !activeMenu.handle) {
      toast.error("Nome e identificador do menu são obrigatórios");
      return;
    }

    setIsSaving(true);
    try {
      await upsertNavigationMenu({
        data: {
          id: activeMenu.id,
          name: activeMenu.name,
          handle: activeMenu.handle,
          items: activeMenu.items,
        },
      });
      toast.success("Menu salvo com sucesso!");
      router.invalidate();
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar menu");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <PageHeader
        title="Navegação"
        actions={
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="font-bold border border-border "
          >
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? "Salvando..." : "Salvar Menu"}
          </Button>
        }
      />

      <div className="flex-1 p-6 flex justify-center">
        <div className="w-full max-w-3xl space-y-6">
          <div className="bg-surface-paper border border-border shadow-sm rounded-xl p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome do Menu</Label>
                <Input
                  value={activeMenu.name}
                  onChange={(e) => setActiveMenu({ ...activeMenu, name: e.target.value })}
                  placeholder="Ex: Menu Principal"
                />
              </div>
              <div className="space-y-2">
                <Label>Identificador (Handle)</Label>
                <Input
                  value={activeMenu.handle}
                  onChange={(e) => setActiveMenu({ ...activeMenu, handle: e.target.value })}
                  placeholder="Ex: main-menu"
                  disabled={!!activeMenu.id} // Prevents changing handle after creation to avoid breaking frontend
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">Links do Menu</h3>
              <Button onClick={handleAddItem} variant="outline" size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Link
              </Button>
            </div>

            {activeMenu.items.length === 0 ? (
              <EmptyState title="Nenhum link configurado neste menu" />
            ) : (
              <div className="space-y-3">
                {activeMenu.items.map((item, index) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-3 bg-surface-paper shadow-sm border border-border rounded-xl"
                  >
                    <GripVertical className="h-5 w-5 text-muted-foreground cursor-move" />
                    <div className="grid grid-cols-2 gap-3 flex-1">
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Rótulo</Label>
                        <Input
                          value={item.label}
                          onChange={(e) => handleItemChange(index, "label", e.target.value)}
                          placeholder="Ex: Produtos"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">URL ou Caminho</Label>
                        <div className="relative">
                          <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            className="pl-9"
                            value={item.url}
                            onChange={(e) => handleItemChange(index, "url", e.target.value)}
                            placeholder="Ex: /produtos ou https://..."
                          />
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive mt-5"
                      onClick={() => handleRemoveItem(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
