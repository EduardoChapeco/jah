import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/workspace/pedidos/entregadores/$id")({
  head: () => ({ meta: [{ title: "Detalhe do Entregador — Wider Workspace" }] }),
  component: EntregadorDetailPage,
});

function EntregadorDetailPage() {
  const { id } = Route.useParams();
  return (
    <div className="p-6">
      <h1 className="text-lg font-semibold">Detalhes do Entregador {id} (Em Construção)</h1>
    </div>
  );
}
