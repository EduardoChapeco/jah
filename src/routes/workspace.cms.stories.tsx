import { createFileRoute, useRouter } from "@tanstack/react-router";
import { Plus, Trash2, Edit3, Image as ImageIcon, Link as LinkIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/commerce/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/state/states";
import { listAdminStories, upsertStory, deleteStory } from "@/services/cms.functions";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/workspace/cms/stories")({
  head: () => ({ meta: [{ title: "Stories (CMS)" }] }),
  loader: async () => {
    const res = await listAdminStories();
    return res || [];
  },
  component: CmsStoriesPage,
});

function CmsStoriesPage() {
  const router = useRouter();
  const stories = Route.useLoaderData();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    id: undefined as string | undefined,
    media_url: "",
    link_url: "",
    status: "active" as "active" | "inactive" | "archived",
    sort_order: 0,
  });

  const handleOpenNew = () => {
    setFormData({
      id: undefined,
      media_url: "",
      link_url: "",
      status: "active",
      sort_order: stories.length,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (story: any) => {
    setFormData({
      id: story.id,
      media_url: story.media_url || "",
      link_url: story.link_url || "",
      status: story.status || "active",
      sort_order: story.sort_order || 0,
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.media_url) {
      toast.error("A URL da mídia é obrigatória");
      return;
    }
    
    setIsSubmitting(true);
    try {
      await upsertStory({
        data: {
          id: formData.id,
          media_url: formData.media_url,
          link_url: formData.link_url || null,
          status: formData.status,
          sort_order: Number(formData.sort_order),
        },
      });
      toast.success("Story salvo com sucesso!");
      setIsModalOpen(false);
      router.invalidate();
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar story");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Tem certeza que deseja excluir este story?")) return;
    try {
      await deleteStory({ data: { id } });
      toast.success("Story excluído.");
      router.invalidate();
    } catch (error: any) {
      toast.error(error.message || "Erro ao excluir story.");
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <PageHeader
        title="Gerenciar Stories"
        actions={
          <Button onClick={handleOpenNew} className="font-bold border border-border shadow-sm">
            <Plus className="mr-2 h-4 w-4" />
            Novo Story
          </Button>
        }
      />

      <div className="flex-1 p-6">
        {stories.length === 0 ? (
          <EmptyState title="Nenhum story ativo" />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {stories.map((story: any) => (
              <Card key={story.id} className="overflow-hidden group relative surface-paper hover:border-primary transition-colors">
                <div className="aspect-[9/16] relative bg-black flex items-center justify-center overflow-hidden">
                  {story.media_url.endsWith(".mp4") ? (
                    <video 
                      src={story.media_url} 
                      className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" 
                      muted 
                    />
                  ) : (
                    <img 
                      src={story.media_url} 
                      alt="Story" 
                      className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" 
                    />
                  )}
                  
                  <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <Button size="icon" variant="secondary" className="h-8 w-8" onClick={() => handleOpenEdit(story)}>
                      <Edit3 className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="destructive" className="h-8 w-8" onClick={() => handleDelete(story.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                    <div className="flex flex-col gap-1">
                      <Badge variant={story.status === "active" ? "default" : "secondary"} className="w-fit text-[10px]">
                        {story.status === "active" ? "Ativo" : "Inativo"}
                      </Badge>
                      {story.link_url && (
                        <div className="flex items-center text-white text-xs gap-1 opacity-90 truncate">
                          <LinkIcon className="h-3 w-3 shrink-0" />
                          <span className="truncate">{story.link_url}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleSave}>
            <DialogHeader>
              <DialogTitle>{formData.id ? "Editar Story" : "Novo Story"}</DialogTitle>
              <DialogDescription>
                Adicione um vídeo (mp4) ou imagem (jpg, png) para aparecer nos Stories.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="media_url">URL da Mídia</Label>
                <div className="flex gap-2">
                  <Input
                    id="media_url"
                    value={formData.media_url}
                    onChange={(e) => setFormData({ ...formData, media_url: e.target.value })}
                    placeholder="https://..."
                    required
                  />
                </div>
                <p className="text-xs text-muted-foreground">Cole a URL direta da imagem ou vídeo.</p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="link_url">Link de Ação (Opcional)</Label>
                <Input
                  id="link_url"
                  value={formData.link_url}
                  onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(val: any) => setFormData({ ...formData, status: val })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Ativo</SelectItem>
                      <SelectItem value="inactive">Inativo</SelectItem>
                      <SelectItem value="archived">Arquivado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="sort_order">Ordem (Posição)</Label>
                  <Input
                    id="sort_order"
                    type="number"
                    value={formData.sort_order}
                    onChange={(e) => setFormData({ ...formData, sort_order: Number(e.target.value) })}
                    min={0}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Salvando..." : "Salvar Story"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
