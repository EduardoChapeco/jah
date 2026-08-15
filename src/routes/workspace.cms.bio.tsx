import { createFileRoute, useRouter } from "@tanstack/react-router";
import { Save, Plus, Trash2, GripVertical, User2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/commerce/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/state/states";
import { getLinkInBio, upsertLinkInBio } from "@/services/cms.functions";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/workspace/cms/bio")({
  head: () => ({ meta: [{ title: "Link-in-Bio (CMS)" }] }),
  loader: async () => {
    const res = await getLinkInBio();
    return res || {};
  },
  component: CmsBioPage,
});

function CmsBioPage() {
  const router = useRouter();
  const initialData = Route.useLoaderData();

  const [formData, setFormData] = useState({
    title: initialData.title || "",
    description: initialData.description || "",
    avatar_url: initialData.avatar_url || "",
    links: Array.isArray(initialData.links) ? initialData.links : [],
  });

  const [isSaving, setIsSaving] = useState(false);

  const handleAddLink = () => {
    setFormData({
      ...formData,
      links: [
        ...formData.links,
        { id: Math.random().toString(36).substr(2, 9), label: "Novo Botão", url: "https://" },
      ],
    });
  };

  const handleLinkChange = (index: number, field: string, value: string) => {
    const newLinks = [...formData.links];
    newLinks[index] = { ...newLinks[index], [field]: value };
    setFormData({ ...formData, links: newLinks });
  };

  const handleRemoveLink = (index: number) => {
    const newLinks = formData.links.filter((_: any, i: number) => i !== index);
    setFormData({ ...formData, links: newLinks });
  };

  const handleSave = async () => {
    if (!formData.title) {
      toast.error("O Título (Nome do Perfil) é obrigatório");
      return;
    }

    setIsSaving(true);
    try {
      await upsertLinkInBio({
        data: {
          title: formData.title,
          description: formData.description,
          avatar_url: formData.avatar_url,
          links: formData.links,
        },
      });
      toast.success("Link-in-Bio atualizado com sucesso!");
      router.invalidate();
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar Perfil Público");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <PageHeader
        title="Perfil Público (Link-in-Bio)"
        actions={
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="font-bold border border-border "
          >
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? "Salvando..." : "Salvar Perfil"}
          </Button>
        }
      />

      <div className="flex-1 p-6 flex justify-center">
        <div className="w-full max-w-3xl space-y-6">
          <div className="bg-surface-paper border border-border shadow-sm rounded-xl p-6 space-y-6">
            <div className="flex items-start gap-6">
              <div className="shrink-0 flex flex-col items-center gap-2">
                <div className="size-24 rounded-full bg-muted border-2 border-border overflow-hidden flex items-center justify-center">
                  {formData.avatar_url ? (
                    <img
                      src={formData.avatar_url}
                      alt="Avatar"
                      className="size-full object-cover"
                    />
                  ) : (
                    <User2 className="size-8 text-muted-foreground opacity-50" />
                  )}
                </div>
                <div className="w-full">
                  <Label className="text-xs">URL do Avatar</Label>
                  <Input
                    className="h-8 text-xs mt-1"
                    placeholder="https://..."
                    value={formData.avatar_url}
                    onChange={(e) => setFormData({ ...formData, avatar_url: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex-1 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Nome do Perfil (Título)</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="@minhaloja"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Bio (Descrição curta)</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Sua bio do instagram..."
                    className="resize-none h-20"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">Botões de Ação (Links)</h3>
              <Button onClick={handleAddLink} variant="outline" size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Botão
              </Button>
            </div>

            {formData.links.length === 0 ? (
              <EmptyState title="Nenhum link adicionado" />
            ) : (
              <div className="space-y-3">
                {formData.links.map((link: any, index: number) => (
                  <div
                    key={link.id || index}
                    className="flex items-center gap-3 p-3 bg-surface-paper shadow-sm border border-border rounded-xl"
                  >
                    <GripVertical className="h-5 w-5 text-muted-foreground cursor-move shrink-0" />
                    <div className="grid grid-cols-2 gap-3 flex-1">
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Rótulo do Botão</Label>
                        <Input
                          value={link.label}
                          onChange={(e) => handleLinkChange(index, "label", e.target.value)}
                          placeholder="Ex: Fale no WhatsApp"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">URL de Destino</Label>
                        <Input
                          value={link.url}
                          onChange={(e) => handleLinkChange(index, "url", e.target.value)}
                          placeholder="https://wa.me/..."
                        />
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive mt-5 shrink-0"
                      onClick={() => handleRemoveLink(index)}
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
