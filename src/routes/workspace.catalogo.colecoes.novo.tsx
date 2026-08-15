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
import { createCollection } from "@/services/admin-catalog.functions";

export const Route = createFileRoute("/workspace/catalogo/colecoes/novo")({
  head: () => ({ meta: [{ title: "Nova Coleção" }] }),
  component: NewCollectionPage,
});

function NewCollectionPage() {
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
    },
  });

  const onSubmit = async (values: any) => {
    setIsSubmitting(true);
    try {
      const res = await createCollection({
        data: {
          name: values.name,
          slug: values.slug,
          status: values.status,
        },
      });

      if (res) {
        toast.success("Coleção criada com sucesso!");
        navigate({ to: "/workspace/catalogo/colecoes" });
      } else {
        toast.error(res.message || "Erro ao criar coleção");
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
        title="Nova coleção"
        actions={
          <Button variant="outline" asChild>
            <Link to="/workspace/catalogo/colecoes">
              <ArrowLeft className="mr-2 size-4" />
              Voltar
            </Link>
          </Button>
        }
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="border border-border bg-card rounded-xl overflow-hidden">
          <div className="p-6 border-b border-border/20 bg-muted/10">
            <h3 className="text-base font-bold">Dados Básicos</h3>
          </div>
          <div className="p-6 space-y-4">
            <div className="space-y-2">
              <Label>Nome da Coleção</Label>
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
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="ghost" asChild>
            <Link to="/workspace/catalogo/colecoes">Cancelar</Link>
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Salvando..." : "Salvar Coleção"}
          </Button>
        </div>
      </form>
    </div>
  );
}
