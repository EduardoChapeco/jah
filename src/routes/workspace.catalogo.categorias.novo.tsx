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
import { createCategory, listCategories } from "@/services/admin-catalog.functions";

export const Route = createFileRoute("/workspace/catalogo/categorias/novo")({
  head: () => ({ meta: [{ title: "Nova Categoria" }] }),
  loader: async () => {
    const res = await listCategories();
    return res || [];
  },
  component: NewCategoryPage,
});

function NewCategoryPage() {
  const existingCategories = Route.useLoaderData();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: "",
      slug: "",
      status: "active",
      parent_id: "none",
    },
  });

  const [coverUrl, setCoverUrl] = useState<string | null>(null);

  const onSubmit = async (values: any) => {
    setIsSubmitting(true);
    try {
      const res = await createCategory({
        data: {
          name: values.name,
          slug: values.slug,
          status: values.status,
          parent_id: values.parent_id === "none" ? null : values.parent_id,
        },
      });

      if (res) {
        toast.success("Categoria criada com sucesso!");
        navigate({ to: "/workspace/catalogo/categorias" });
      } else {
        toast.error(res.message || "Erro ao criar categoria");
      }
    } catch (e) {
      toast.error("Erro inesperado");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-2xl">
      <PageHeader
        eyebrow="Catálogo"
        title="Nova categoria"
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
        <div>
          <header className="mb-4">
            <h2 className="font-bold text-lg">Dados Básicos</h2>
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
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Slug</Label>
              <Input {...register("slug", { required: "Obrigatório" })} />
              {errors.slug && <p className="text-xs text-destructive">{errors.slug.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Categoria Pai</Label>
              <Select defaultValue="none" onValueChange={(v) => setValue("parent_id", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhuma (Categoria Principal)</SelectItem>
                  {existingCategories.map((cat: any) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select defaultValue="active" onValueChange={(v) => setValue("status", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativa</SelectItem>
                  <SelectItem value="inactive">Inativa</SelectItem>
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
            {isSubmitting ? "Salvando..." : "Salvar Categoria"}
          </Button>
        </div>
      </form>
    </div>
  );
}
