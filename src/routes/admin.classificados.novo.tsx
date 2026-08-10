import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ClassifiedForm } from "@/components/admin/classified-form";
import { upsertClassifiedHandler } from "@/services/classifieds.functions";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Tag } from "lucide-react";
import type { Classified } from "@/types/community";

type ClassifiedFormInput = Pick<Classified, "title" | "content" | "category" | "price_cents" | "status">;

export const Route = createFileRoute("/admin/classificados/novo")({
  component: NovoClassificado,
});

function NovoClassificado() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data: ClassifiedFormInput) =>
      upsertClassifiedHandler({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classifieds"] });
      toast.success("Classificado publicado com sucesso!");
      navigate({ to: "/admin/classificados" });
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao publicar classificado");
    },
  });

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="font-display text-4xl uppercase tracking-tighter text-ink flex items-center gap-3">
          <Tag className="size-8 text-electric-cyan" />
          Novo Classificado
        </h1>
        <p className="font-serif text-ink/70">
          Publique um serviço, vaga ou item para venda no mural da comunidade.
        </p>
      </div>

      <ClassifiedForm 
        onSubmit={async (values) => {
          await mutation.mutateAsync(values);
        }}
        isSubmitting={mutation.isPending}
      />
    </div>
  );
}
