import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ClassifiedForm } from "@/components/admin/classified-form";
import { getClassifiedHandler, upsertClassifiedHandler, deleteClassifiedHandler } from "@/services/classifieds.functions";
import { toast } from "sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Tag, Loader2, Trash2 } from "lucide-react";
import type { Classified } from "@/types/community";
import { Button } from "@/components/ui/button";

type ClassifiedFormInput = Pick<Classified, "title" | "content" | "category" | "price_cents" | "status">;


export const Route = createFileRoute("/admin/classificados/$id")({
  component: EditarClassificado,
});

function EditarClassificado() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: classified, isLoading } = useQuery({
    queryKey: ["classified", id],
    queryFn: () => getClassifiedHandler({ data: id }),
  });

  const mutation = useMutation({
    mutationFn: (data: ClassifiedFormInput) =>
      upsertClassifiedHandler({ data: { ...data, id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classifieds"] });
      queryClient.invalidateQueries({ queryKey: ["classified", id] });
      toast.success("Classificado atualizado com sucesso!");
      navigate({ to: "/admin/classificados" });
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao atualizar classificado");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteClassifiedHandler({ data: id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classifieds"] });
      toast.success("Classificado excluído.");
      navigate({ to: "/admin/classificados" });
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao excluir classificado");
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="size-8 animate-spin text-ink/40" />
      </div>
    );
  }

  if (!classified) {
    return (
      <div className="text-center py-20">
        <h2 className="font-display text-2xl uppercase tracking-tight text-ink mb-2">
          Classificado não encontrado
        </h2>
        <Button asChild variant="outline" className="mt-4 border-2 border-ink">
          <button onClick={() => navigate({ to: "/admin/classificados" })}>Voltar</button>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl uppercase tracking-tighter text-ink flex items-center gap-3">
            <Tag className="size-8 text-electric-cyan" />
            Editar Classificado
          </h1>
          <p className="font-serif text-ink/70">
            Atualize as informações do seu anúncio.
          </p>
        </div>
        <Button 
          variant="destructive" 
          onClick={() => {
            if (confirm("Tem certeza que deseja excluir este classificado?")) {
              deleteMutation.mutate();
            }
          }}
          disabled={deleteMutation.isPending}
          className="border-2 border-ink shadow-hard"
        >
          {deleteMutation.isPending ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Trash2 className="size-4 mr-2" />}
          Excluir
        </Button>
      </div>

      <ClassifiedForm 
        defaultValues={classified}
        onSubmit={async (values) => {
          await mutation.mutateAsync(values);
        }}
        isSubmitting={mutation.isPending}
      />
    </div>
  );
}
