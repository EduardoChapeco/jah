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
import { getCollectionById, updateCollection } from "@/services/admin-catalog.functions";

export const Route = createFileRoute("/workspace/catalogo/colecoes/$id")({
  head: ({ loaderData }) => ({ meta: [{ title: `${(loaderData as any)?.name || "Coleção"} | Workspace Wider` }] }),
  loader: async ({ params }): Promise<any> => {
    try {
      const res = await getCollectionById({ data: { id: params.id } });
      return res || { id: params.id, name: "Coleção", slug: "colecao", status: "active" };
    } catch {
      return { id: params.id, name: "Coleção", slug: "colecao", status: "active" };
    }
  },
  component: EditCollectionPage,
});

function EditCollectionPage() {
  const collection = Route.useLoaderData() as any;
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: collection.name,
      slug: collection.slug,
      status: collection.status,
    },
  });

  const onSubmit = async (values: any) => {
    setIsSubmitting(true);
    try {
      const res = await updateCollection({
        data: {
          id: collection.id,
          name: values.name.trim(),
          slug: values.slug.trim(),
          status: values.status,
        },
      });

      if (res) {
        toast.success("Coleção atualizada com sucesso!");
        navigate({ to: "/workspace/catalogo/colecoes" });
      }
    } catch (e: any) {
      toast.error(e?.message || "Erro inesperado ao salvar alterações");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border border-border/60 bg-card">
        <div className="space-y-1">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-primary">
            Catálogo & Coleções
          </span>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Editar Coleção: {collection.name}
          </h1>
          <p className="text-xs text-muted-foreground">
            Ajuste o nome, identificador e visibilidade desta coleção no catálogo.
          </p>
        </div>

        <Button asChild variant="outline" size="sm" className="rounded-xl text-xs font-bold gap-1.5 shrink-0">
          <Link to="/workspace/catalogo/colecoes">
            <ArrowLeft className="size-3.5" />
            <span>Voltar</span>
          </Link>
        </Button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-card rounded-2xl border border-border/60 p-6 space-y-5">
          <div className="pb-3 border-b border-border/40">
            <h3 className="text-sm font-bold text-foreground">Dados da Coleção</h3>
            <p className="text-xs text-muted-foreground">
              Coleções agrupam produtos temáticos na vitrine da loja.
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">Nome da Coleção *</Label>
              <Input
                {...register("name", { required: "Obrigatório" })}
                className="rounded-xl text-xs h-9"
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

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">Identificador / Slug *</Label>
              <Input {...register("slug", { required: "Obrigatório" })} className="rounded-xl text-xs h-9" />
              {errors.slug?.message && (
                <p className="text-xs text-destructive">{String(errors.slug.message)}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">Status de Exibição</Label>
              <Select
                defaultValue={collection.status}
                onValueChange={(v) => setValue("status", v as any)}
              >
                <SelectTrigger className="rounded-xl text-xs h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="active" className="text-xs font-medium">Ativa na Vitrine</SelectItem>
                  <SelectItem value="inactive" className="text-xs font-medium">Oculta (Rascunho)</SelectItem>
                  <SelectItem value="archived" className="text-xs font-medium">Arquivada (Arquivo Morto)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" size="sm" className="rounded-xl text-xs font-bold" asChild>
            <Link to="/workspace/catalogo/colecoes">Cancelar</Link>
          </Button>
          <Button type="submit" size="sm" disabled={isSubmitting} className="rounded-xl text-xs font-bold bg-primary text-primary-foreground">
            {isSubmitting ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </div>
      </form>
    </div>
  );
}
