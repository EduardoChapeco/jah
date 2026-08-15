import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { Plus, Edit3, Trash2, Search, FileText } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/commerce/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/state/states";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { listAdminPages, createPage, deletePage } from "@/services/cms.functions";

export const Route = createFileRoute("/workspace/cms/paginas/")({
  head: () => ({ meta: [{ title: "Páginas (CMS)" }] }),
  loader: async () => {
    const res = await listAdminPages();
    return res || [];
  },
  component: CmsPagesPage,
});

function CmsPagesPage() {
  const router = useRouter();
  const navigate = useNavigate();
  const pages = Route.useLoaderData();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    status: "draft" as "draft" | "published" | "archived",
  });

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    const slug = title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
    setFormData({ ...formData, title, slug });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.slug) {
      toast.error("Preencha título e slug");
      return;
    }

    setIsSubmitting(true);
    try {
      const newPage = await createPage({
        data: {
          title: formData.title,
          slug: formData.slug,
          status: formData.status,
        },
      });
      toast.success("Página criada com sucesso!");
      setIsCreateModalOpen(false);
      router.invalidate();

      // Redirect to builder
      if (newPage?.id) {
        navigate({
          to: "/workspace/builder/$documentId/editor",
          params: { documentId: newPage.id },
        });
      }
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar página");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Tem certeza que deseja excluir a página"${title}"?`)) return;
    try {
      await deletePage({ data: { id } });
      toast.success("Página excluída.");
      router.invalidate();
    } catch (error: any) {
      toast.error(error.message || "Erro ao excluir página.");
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <PageHeader
        title="Páginas (CMS)"
        actions={
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button className="font-bold border border-border ">
                <Plus className="mr-2 h-4 w-4" />
                Nova Página
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <form onSubmit={handleCreate}>
                <DialogHeader>
                  <DialogTitle>Criar Nova Página</DialogTitle>
                  <DialogDescription>
                    Páginas institucionais, Landing Pages e políticas.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="title">Título</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={handleTitleChange}
                      placeholder="Ex: Sobre Nós"
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="slug">Slug (URL)</Label>
                    <Input
                      id="slug"
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      placeholder="Ex: sobre-nos"
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="status">Status Inicial</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(val: any) => setFormData({ ...formData, status: val })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Rascunho</SelectItem>
                        <SelectItem value="published">Publicado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateModalOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Criando..." : "Criar e Editar"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="flex-1 p-6">
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar páginas..."
                className="pl-9 bg-background border border-border"
              />
            </div>
          </div>

          {pages.length === 0 ? (
            <EmptyState title="Nenhuma página criada" />
          ) : (
            <div className="bg-surface-paper shadow-sm rounded-xl border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Título</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pages.map((page: any) => (
                    <TableRow key={page.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          {page.title}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">/{page.slug}</TableCell>
                      <TableCell>
                        <Badge variant={page.status === "published" ? "default" : "secondary"}>
                          {page.status === "published" ? "Publicado" : "Rascunho"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" asChild>
                            <Link
                              to="/workspace/builder/$documentId/editor"
                              params={{ documentId: page.id }}
                            >
                              <Edit3 className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive"
                            onClick={() => handleDelete(page.id, page.title)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
