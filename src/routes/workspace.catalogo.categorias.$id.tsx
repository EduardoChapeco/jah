import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

import { PageHeader } from "@/components/commerce/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Surface } from "@/components/ui/surface";
import { ImageUpload } from "@/components/ui/image-upload";
import {
  getCategoryById,
  listCategories,
  updateCategory,
} from "@/services/admin-catalog.functions";

export const Route = createFileRoute("/workspace/catalogo/categorias/$id")({
  head: () => ({ meta: [{ title: "Editar Categoria" }] }),
  loader: async ({ params }) => {
    try {
      const [resCategory, resAll] = await Promise.all([
        getCategoryById({ data: { id: params.id } }).catch(() => null),
        listCategories().catch(() => []),
      ]);

      const categoryData = resCategory?.status === "success" ? resCategory.data : resCategory?.data || null;

      return {
        category: categoryData || { id: params.id, name: "Categoria", slug: "categoria", status: "active" },
        allCategories: resAll || [],
      };
    } catch {
      return {
        category: { id: params.id, name: "Categoria", slug: "categoria", status: "active" },
        allCategories: [],
      };
    }
  },
  component: EditCategoryPage,
});

function EditCategoryPage() {
  const { category, allCategories } = Route.useLoaderData();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const parentOptions = allCategories.filter((c: any) => c.id !== category.id);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: category.name,
      slug: category.slug,
      status: category.status,
      parent_id: category.parent_id || "none",
    },
  });

  const [coverUrl, setCoverUrl] = useState<string | null>(category.cover_url || null);

  const onSubmit = async (values: any) => {
    setIsSubmitting(true);
    try {
      const res = await updateCategory({
        data: {
          id: category.id,
          name: values.name,
          slug: values.slug,
          status: values.status,
          parent_id: values.parent_id === "none" ? null : values.parent_id,
        },
      });

      if (res) {
        toast.success("Categoria atualizada com sucesso!");
        navigate({ to: "/workspace/catalogo/categorias" });
      } else {
        toast.error(res.message || "Erro ao atualizar categoria");
      }
    } catch (e) {
      toast.error("Erro inesperado ao salvar alterações");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-2xl">
      <PageHeader
        eyebrow="Catálogo"
        title={`Editar Categoria: ${category.name}`}
        actions={
          <Button variant="outline" asChild>
            <Link to="/workspace/catalogo/categorias">
              <ArrowLeft className="mr-2 size-4" />
              Voltar
            </Link>
          </Button>
        }
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-card rounded-2xl border border-border/60 p-6 space-y-6">
          <header className="space-y-1 pb-3 border-b border-border/40">
            <h2 className="font-bold text-base text-foreground">Dados Básicos</h2>
          </header>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome da Categoria</Label>
              <Input
                {...register("name", { required: "Obrigatório" })}
                onChange={(e) => {
                  register("name").onChange(e);
                  const slug = e.target.value
                    .toLowerCase()
                    .normalize("NFD")
                    .replace(/[\u0300-\u036f]/g, "")
                    .replace(/[^a-z0-9]+/g, "-")
                    .replace(/(^-|-$)+/g, "");
                  setValue("slug", slug);
                }}
              />
              {errors.name?.message && (
                <p className="text-xs text-destructive">{String(errors.name.message)}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Slug</Label>
              <Input {...register("slug", { required: "Obrigatório" })} />
              {errors.slug?.message && (
                <p className="text-xs text-destructive">{String(errors.slug.message)}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Categoria Pai</Label>
              <Select
                defaultValue={category.parent_id || "none"}
                onValueChange={(v) => setValue("parent_id", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhuma (Categoria Principal)</SelectItem>
                  {parentOptions.map((cat: any) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                defaultValue={category.status}
                onValueChange={(v) => setValue("status", v as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativa</SelectItem>
                  <SelectItem value="inactive">Inativa</SelectItem>
                  <SelectItem value="archived">Arquivada (Arquivo Morto)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Foto de Capa (Opcional)</Label>
              <div className="max-w-sm">
                <ImageUpload onChange={setCoverUrl} value={coverUrl} bucket="product-media" />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="ghost" asChild>
            <Link to="/workspace/catalogo/categorias">Cancelar</Link>
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </div>
      </form>
    </div>
  );
}
