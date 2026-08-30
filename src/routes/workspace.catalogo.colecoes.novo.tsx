import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

import { PageHeader } from "@/components/commerce/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImageUpload } from "@/components/ui/image-upload";
import { createCollection } from "@/services/admin-catalog.functions";

export const Route = createFileRoute("/workspace/catalogo/colecoes/novo")({
  head: () => ({ meta: [{ title: "Nova Coleção | Workspace Wider" }] }),
  component: NewCollectionPage,
});

function NewCollectionPage() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      status: "active",
    },
  });

  const onSubmit = async (values: any) => {
    setIsSubmitting(true);
    try {
      const res = await createCollection({
        data: {
          name: values.name.trim(),
          slug: values.slug.trim(),
          description: values.description?.trim() || null,
          cover_url: coverUrl || null,
          status: values.status,
        },
      });

      if (res) {
        toast.success("Coleção criada com sucesso!");
        navigate({ to: "/workspace/catalogo/colecoes" });
      }
    } catch (e: any) {
      toast.error(e?.message || "Erro inesperado ao criar coleção");
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
            Nova Coleção
          </h1>
          <p className="text-xs text-muted-foreground">
            Crie seleções temáticas e destaques sazonais para a vitrine da sua loja.
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
            <h3 className="text-sm font-bold text-foreground">Dados Básicos da Coleção</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Defina o nome, identificador na URL, descrição e capa visual.
            </p>
          </div>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">Nome da Coleção *</Label>
              <Input
                {...register("name", { required: "Obrigatório" })}
                className="rounded-xl text-xs h-10"
                placeholder="Ex: Coleção Verão 2026, Seleção Gourmet..."
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
              {errors.name && <p className="text-xs text-destructive">{String(errors.name.message)}</p>}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">Slug Identificador (URL) *</Label>
              <Input
                {...register("slug", { required: "Obrigatório" })}
                className="rounded-xl text-xs h-10 font-mono"
                placeholder="colecao-verao-2026"
              />
              {errors.slug && <p className="text-xs text-destructive">{String(errors.slug.message)}</p>}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">Descrição Curta (Opcional)</Label>
              <Textarea
                {...register("description")}
                placeholder="Explique o tema ou os produtos desta coleção..."
                rows={2}
                className="rounded-2xl text-xs resize-none"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">Status de Exibição</Label>
              <Select defaultValue="active" onValueChange={(v) => setValue("status", v)}>
                <SelectTrigger className="rounded-xl text-xs h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  <SelectItem value="active" className="text-xs font-semibold text-emerald-600">
                    ● Ativa na Vitrine
                  </SelectItem>
                  <SelectItem value="inactive" className="text-xs text-muted-foreground">
                    ● Inativa / Oculta
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">Imagem de Capa (Panorâmica 16:10)</Label>
              <ImageUpload
                value={coverUrl}
                onChange={setCoverUrl}
                aspectPreset="widescreen"
                bucket="product-media"
                helperText="Upload com recorte panorâmico 16:10 para exibição na vitrine"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <Button type="button" variant="outline" size="sm" className="rounded-xl text-xs font-bold" asChild>
            <Link to="/workspace/catalogo/colecoes">Cancelar</Link>
          </Button>
          <Button type="submit" disabled={isSubmitting} size="sm" className="rounded-xl text-xs font-bold bg-primary text-primary-foreground min-w-28">
            {isSubmitting ? "Salvando..." : "Salvar Coleção"}
          </Button>
        </div>
      </form>
    </div>
  );
}
