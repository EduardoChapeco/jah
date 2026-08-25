import { createFileRoute } from "@tanstack/react-router";
import { getLegalDocumentBySlug } from "@/services/legal.functions";
import { LegalDocumentViewer } from "@/components/legal/legal-document-viewer";
import { EmptyState } from "@/components/state/states";

export const Route = createFileRoute("/_store/trocas-e-devolucoes")({
  head: ({ loaderData }) => ({
    meta: [
      {
        title: loaderData?.title
          ? `${loaderData.title} | Wider`
          : "Políticas de Trocas, Devoluções e Cancelamentos | Wider",
      },
    ],
  }),
  loader: async () => {
    try {
      const doc = await getLegalDocumentBySlug({ data: { slug: "trocas-e-devolucoes" } });
      return doc;
    } catch {
      return null;
    }
  },
  component: TrocasEDevolucoesPage,
});

function TrocasEDevolucoesPage() {
  const doc = Route.useLoaderData();

  if (!doc) {
    return (
      <div className="container py-20">
        <EmptyState title="Documento não encontrado" />
      </div>
    );
  }

  return <LegalDocumentViewer document={doc} />;
}
