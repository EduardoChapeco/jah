import { createFileRoute } from "@tanstack/react-router";
import { getLegalDocumentBySlug } from "@/services/legal.functions";
import { LegalDocumentViewer } from "@/components/legal/legal-document-viewer";
import { EmptyState } from "@/components/state/states";

export const Route = createFileRoute("/_store/termos")({
  head: ({ loaderData }) => ({
    meta: [
      {
        title: loaderData?.title
          ? `${loaderData.title} | Wider`
          : "Termos Gerais de Uso e Condições | Wider",
      },
    ],
  }),
  loader: async () => {
    try {
      const doc = await getLegalDocumentBySlug({ data: { slug: "termos" } });
      return doc;
    } catch {
      return null;
    }
  },
  component: TermosPage,
});

function TermosPage() {
  const doc = Route.useLoaderData();

  if (!doc) {
    return (
      <div className="container py-20">
        <EmptyState title="Documento legal não encontrado" />
      </div>
    );
  }

  return <LegalDocumentViewer document={doc} />;
}
