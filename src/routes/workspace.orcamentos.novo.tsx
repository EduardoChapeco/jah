import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/workspace/orcamentos/novo")({
  head: () => ({ meta: [{ title: "Novo Orçamento — JAH Workspace" }] }),
  component: NovoOrcamentoPage,
});

function NovoOrcamentoPage() {
  return (
    <div className="p-6">
      <h1 className="text-lg font-semibold">Novo Orçamento (Em Construção)</h1>
    </div>
  );
}
