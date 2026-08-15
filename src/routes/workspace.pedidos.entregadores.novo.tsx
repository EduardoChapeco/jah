import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/workspace/pedidos/entregadores/novo")({
  head: () => ({ meta: [{ title: "Novo Entregador — JAH Workspace" }] }),
  component: NovoEntregadorPage,
});

function NovoEntregadorPage() {
  return (
    <div className="p-6">
      <h1 className="text-lg font-semibold">Novo Entregador (Em Construção)</h1>
    </div>
  );
}
